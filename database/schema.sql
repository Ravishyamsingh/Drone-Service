-- DroneFlow Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Client Information
    "clientName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    -- Service Details
    "serviceType" VARCHAR(50) NOT NULL CHECK (
        "serviceType" IN (
            'aerial_photography',
            'delivery',
            'agriculture_spraying',
            'surveillance',
            'inspection',
            'mapping',
            'other'
        )
    ),
    location TEXT NOT NULL,
    "preferredDate" DATE NOT NULL,
    "preferredTime" VARCHAR(20) NOT NULL CHECK (
        "preferredTime" IN ('morning', 'afternoon', 'evening')
    ),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN ('normal', 'high', 'urgent')
    ),
    budget VARCHAR(20) CHECK (
        budget IN (
            'under_500',
            '500_1000',
            '1000_2500',
            '2500_5000',
            'over_5000'
        )
    ),
    description TEXT NOT NULL,
    
    -- Terms and Updates
    terms BOOLEAN DEFAULT FALSE,
    updates BOOLEAN DEFAULT FALSE,
    
    -- Status and Workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')
    ),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    
    -- Operator Information
    operator_notes TEXT,
    assigned_operator_id UUID,
    
    -- Additional Fields
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_request_id ON service_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_type ON service_requests(serviceType);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_email ON service_requests(email);
CREATE INDEX IF NOT EXISTS idx_service_requests_preferred_date ON service_requests(preferredDate);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created ON service_requests(status, created_at DESC);

-- Create operators table (optional - for future use)
CREATE TABLE IF NOT EXISTS operators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES service_requests(request_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (
        type IN ('status_update', 'new_request', 'assignment', 'completion', 'cancellation')
    ),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_email VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_email, is_read) WHERE is_read = FALSE;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on service_requests
CREATE TRIGGER update_service_requests_updated_at 
    BEFORE UPDATE ON service_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at on operators
CREATE TRIGGER update_operators_updated_at 
    BEFORE UPDATE ON operators 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate request ID
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'DR-' || EXTRACT(YEAR FROM NOW())::text || '-' || 
                  LPAD((RANDOM() * 999999)::INTEGER::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM service_requests WHERE request_id = new_id) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique request ID after 1000 attempts';
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when request status changes
CREATE OR REPLACE FUNCTION create_status_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (request_id, type, title, message, recipient_email)
        VALUES (
            NEW.request_id,
            'status_update',
            'Request Status Updated',
            'Your drone service request ' || NEW.request_id || ' status has been updated to: ' || 
            CASE NEW.status
                WHEN 'pending' THEN 'Pending Review'
                WHEN 'confirmed' THEN 'Confirmed'
                WHEN 'in_progress' THEN 'In Progress'
                WHEN 'completed' THEN 'Completed'
                WHEN 'cancelled' THEN 'Cancelled'
                ELSE NEW.status
            END,
            NEW.email
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status change notifications
CREATE TRIGGER notify_status_change
    AFTER UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_status_notification();

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')),
        'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'urgent', COUNT(*) FILTER (WHERE priority = 'urgent'),
        'high_priority', COUNT(*) FILTER (WHERE priority = 'high'),
        'today_requests', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
        'this_week_requests', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW())),
        'this_month_requests', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))
    ) INTO result
    FROM service_requests;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert new requests (public form submissions)
CREATE POLICY "Anyone can create service requests" ON service_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Policy to allow users to view their own requests
CREATE POLICY "Users can view their own requests" ON service_requests
    FOR SELECT TO anon, authenticated
    USING (true); -- For now, allow all reads. In production, you might want: email = auth.jwt() ->> 'email'

-- Policy for admin users to view/update all requests
-- You'll need to create an admin role or use service role for admin operations

-- Insert some sample data for testing
INSERT INTO service_requests (
    request_id, clientName, email, phone, serviceType, location, 
    preferredDate, preferredTime, priority, budget, description, 
    terms, updates, status, confirmed_at, operator_notes
) VALUES 
(
    'DR-2024-001234',
    'John Smith',
    'john.smith@email.com',
    '(555) 123-4567',
    'aerial_photography',
    '123 Main Street, San Francisco, CA 94105',
    '2024-01-15',
    'morning',
    'high',
    '500_1000',
    'Need aerial photography for real estate listing. Property is a 3-bedroom house with a large backyard.',
    true,
    true,
    'in_progress',
    NOW() - INTERVAL '1 day',
    'Equipment prepared. Weather conditions are favorable.'
),
(
    'DR-2024-001235',
    'Sarah Johnson',
    'sarah.j@company.com',
    '(555) 987-6543',
    'delivery',
    '456 Oak Avenue, Los Angeles, CA 90210',
    '2024-01-14',
    'afternoon',
    'urgent',
    'under_500',
    'Emergency medical supply delivery to remote location. Package is temperature sensitive.',
    true,
    true,
    'completed',
    NOW() - INTERVAL '2 days',
    'Delivery completed successfully within required timeframe.'
),
(
    'DR-2024-001236',
    'Mike Chen',
    'mike.chen@farm.org',
    '(555) 456-7890',
    'agriculture_spraying',
    'Green Valley Farm, 789 Rural Road, Fresno, CA 93721',
    '2024-01-20',
    'morning',
    'normal',
    '2500_5000',
    'Crop spraying for 50-acre corn field. Need pesticide application before rain season.',
    true,
    false,
    'pending',
    NULL,
    NULL
);

-- Insert sample operators
INSERT INTO operators (name, email, phone, specialties, is_active) VALUES
('Alex Johnson', 'alex@droneflow.com', '(555) 100-0001', ARRAY['aerial_photography', 'surveillance'], true),
('Maria Garcia', 'maria@droneflow.com', '(555) 100-0002', ARRAY['delivery', 'inspection'], true),
('David Chen', 'david@droneflow.com', '(555) 100-0003', ARRAY['agriculture_spraying', 'mapping'], true);

-- Comments for documentation
COMMENT ON TABLE service_requests IS 'Main table storing all drone service requests';
COMMENT ON COLUMN service_requests.request_id IS 'Unique human-readable request identifier (e.g., DR-2024-001234)';
COMMENT ON COLUMN service_requests.status IS 'Current status of the request in the workflow';
COMMENT ON COLUMN service_requests.metadata IS 'Additional flexible data storage for future features';

COMMENT ON TABLE notifications IS 'System notifications for status updates and communications';
COMMENT ON TABLE operators IS 'Drone operators who can be assigned to requests';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '✅ DroneFlow database schema has been successfully created!';
    RAISE NOTICE '📊 Tables created: service_requests, operators, notifications';
    RAISE NOTICE '🔧 Functions created: generate_request_id, get_dashboard_stats';
    RAISE NOTICE '🛡️ Row Level Security policies enabled';
    RAISE NOTICE '📝 Sample data inserted for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your drone service tracking system is ready to use!';
END $$;