// DroneFlow - Service Requests Routes

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Import SSE functions for real-time updates
let sseEvents = null;
try {

    
    sseEvents = require('./events');
} catch (error) {
    console.warn('SSE events module not loaded:', error.message);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Enable Supabase now that database schema is set up
const ENABLE_SUPABASE = true; // Database schema has been run successfully

if (!supabaseUrl || !supabaseKey || !ENABLE_SUPABASE) {
    console.warn('⚠️  Using mock data for development. Set ENABLE_SUPABASE=true to use Supabase.');
}

const supabase = (supabaseUrl && supabaseKey && ENABLE_SUPABASE) ?
    createClient(supabaseUrl, supabaseKey) : null;

// Mock data store for development (when Supabase is not configured)
let mockRequests = [
    {
        request_id: 'DR-2024-001234',
        clientName: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        serviceType: 'aerial_photography',
        location: '123 Main Street, San Francisco, CA 94105',
        preferredDate: '2024-01-15',
        preferredTime: 'morning',
        priority: 'high',
        budget: '500_1000',
        description: 'Need aerial photography for real estate listing. Property is a 3-bedroom house with a large backyard. Looking for exterior shots and some interior aerial views if possible.',
        terms: true,
        updates: true,
        status: 'in_progress',
        created_at: '2024-01-10T10:30:00.000Z',
        updated_at: '2024-01-12T14:20:00.000Z',
        confirmed_at: '2024-01-11T09:15:00.000Z',
        started_at: '2024-01-12T14:20:00.000Z',
        estimated_completion: '2024-01-16T18:00:00.000Z',
        operator_notes: 'Equipment prepared. Weather conditions are favorable for tomorrow morning shoot.'
    },
    {
        request_id: 'DR-2024-001235',
        clientName: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        phone: '(555) 987-6543',
        serviceType: 'delivery',
        location: '456 Oak Avenue, Los Angeles, CA 90210',
        preferredDate: '2024-01-14',
        preferredTime: 'afternoon',
        priority: 'urgent',
        budget: 'under_500',
        description: 'Emergency medical supply delivery to remote location. Package is temperature sensitive and must arrive within 4 hours.',
        terms: true,
        updates: true,
        status: 'completed',
        created_at: '2024-01-08T08:45:00.000Z',
        updated_at: '2024-01-08T16:30:00.000Z',
        confirmed_at: '2024-01-08T09:00:00.000Z',
        started_at: '2024-01-08T12:15:00.000Z',
        completed_at: '2024-01-08T16:30:00.000Z',
        estimated_completion: '2024-01-08T16:45:00.000Z',
        operator_notes: 'Delivery completed successfully. Package delivered in perfect condition within the required timeframe.'
    },
    {
        request_id: 'DR-2024-001236',
        clientName: 'Mike Chen',
        email: 'mike.chen@farm.org',
        phone: '(555) 456-7890',
        serviceType: 'agriculture_spraying',
        location: 'Green Valley Farm, 789 Rural Road, Fresno, CA 93721',
        preferredDate: '2024-01-20',
        preferredTime: 'morning',
        priority: 'normal',
        budget: '2500_5000',
        description: 'Crop spraying for 50-acre corn field. Need pesticide application before the upcoming rain season. Field has some power lines on the eastern border.',
        terms: true,
        updates: false,
        status: 'pending',
        created_at: '2024-01-09T16:20:00.000Z',
        updated_at: '2024-01-09T16:20:00.000Z',
        estimated_completion: '2024-01-22T17:00:00.000Z'
    }
];

// Validation middleware
const validateRequest = (req, res, next) => {
    const {
        clientName,
        email,
        phone,
        serviceType,
        location,
        preferredDate,
        preferredTime,
        description
    } = req.body;

    const errors = [];

    // Required field validation
    if (!clientName || clientName.trim().length < 2) {
        errors.push('Client name is required and must be at least 2 characters');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email address is required');
    }

    if (!phone || phone.trim().length < 10) {
        errors.push('Valid phone number is required');
    }

    if (!serviceType || !isValidServiceType(serviceType)) {
        errors.push('Valid service type is required');
    }

    if (!location || location.trim().length < 10) {
        errors.push('Detailed location is required');
    }

    if (!preferredDate || !isValidDate(preferredDate)) {
        errors.push('Valid preferred date is required');
    }

    if (!preferredTime || !isValidTime(preferredTime)) {
        errors.push('Valid preferred time is required');
    }

    if (!description || description.trim().length < 20) {
        errors.push('Detailed description is required (minimum 20 characters)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

// Validation helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidServiceType(type) {
    const validTypes = [
        'aerial_photography',
        'delivery',
        'agriculture_spraying',
        'surveillance',
        'inspection',
        'mapping',
        'other'
    ];
    return validTypes.includes(type);
}

function isValidDate(date) {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj) && dateObj > new Date();
}

function isValidTime(time) {
    const validTimes = ['morning', 'afternoon', 'evening'];
    return validTimes.includes(time);
}

function generateRequestId() {
    const prefix = 'DR';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${year}-${random}`;
}

// GET /api/requests - Get all requests with optional filtering
router.get('/', async (req, res) => {
    try {
        const { status, serviceType, priority, search, limit = 50, offset = 0 } = req.query;
        
        // Use mock data for reliable operation
            // Mock data response
            let filteredRequests = [...mockRequests];

            // Apply filters to mock data
            if (status) {
                filteredRequests = filteredRequests.filter(req => req.status === status);
            }

            if (serviceType) {
                filteredRequests = filteredRequests.filter(req => req.serviceType === serviceType);
            }

            if (priority) {
                filteredRequests = filteredRequests.filter(req => req.priority === priority);
            }

            if (search) {
                const searchLower = search.toLowerCase();
                filteredRequests = filteredRequests.filter(req =>
                    req.request_id.toLowerCase().includes(searchLower) ||
                    req.clientName.toLowerCase().includes(searchLower) ||
                    req.location.toLowerCase().includes(searchLower)
                );
            }

            // Apply pagination
            const startIndex = parseInt(offset);
            const endIndex = startIndex + parseInt(limit);
            const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: paginatedRequests,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: filteredRequests.length
                }
            });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET /api/requests/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Try Supabase first, fall back to mock data if it fails
        try {
            if (supabase) {
                // Supabase aggregation query
                const { data, error } = await supabase
                    .from('service_requests')
                    .select('status');

                if (error) {
                    console.warn('Supabase stats query failed, falling back to mock data:', error);
                    throw error;
                }

                const stats = {
                    total: data.length,
                    pending: data.filter(req => req.status === 'pending' || req.status === 'confirmed').length,
                    in_progress: data.filter(req => req.status === 'in_progress').length,
                    completed: data.filter(req => req.status === 'completed').length
                };

                return res.json({
                    success: true,
                    data: stats
                });
            }
        } catch (supabaseError) {
            console.warn('Supabase connection failed for stats, using mock data:', supabaseError.message);
        }
        
        // Mock stats calculation (fallback)
        const stats = {
            total: mockRequests.length,
            pending: mockRequests.filter(req => req.status === 'pending' || req.status === 'confirmed').length,
            in_progress: mockRequests.filter(req => req.status === 'in_progress').length,
            completed: mockRequests.filter(req => req.status === 'completed').length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET /api/requests/:id - Get specific request
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (supabase) {
            const { data, error } = await supabase
                .from('service_requests')
                .select('*')
                .eq('request_id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({
                        success: false,
                        message: 'Request not found'
                    });
                }
                throw error;
            }

            res.json({
                success: true,
                data
            });
        } else {
            // Mock data lookup
            const request = mockRequests.find(req => req.request_id === id);

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found'
                });
            }

            res.json({
                success: true,
                data: request
            });
        }
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// POST /api/requests - Create new request
router.post('/', validateRequest, async (req, res) => {
    try {
        const requestData = {
            ...req.body,
            request_id: req.body.request_id || generateRequestId(),
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (supabase) {
            const { data, error } = await supabase
                .from('service_requests')
                .insert([requestData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Broadcast real-time update
            if (sseEvents && sseEvents.broadcastToClients) {
                sseEvents.broadcastToClients('request-created', {
                    request: data,
                    message: `New service request: ${data.request_id}`
                });
            }

            res.status(201).json({
                success: true,
                message: 'Service request created successfully',
                data
            });
        } else {
            // Mock data creation
            mockRequests.unshift(requestData);

            // Broadcast real-time update
            if (sseEvents && sseEvents.broadcastToClients) {
                sseEvents.broadcastToClients('request-created', {
                    request: requestData,
                    message: `New service request: ${requestData.request_id}`
                });
            }

            res.status(201).json({
                success: true,
                message: 'Service request created successfully',
                data: requestData
            });
        }
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// PUT /api/requests/:id - Update request
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove read-only fields
        delete updateData.request_id;
        delete updateData.created_at;

        if (supabase) {
            const { data, error } = await supabase
                .from('service_requests')
                .update(updateData)
                .eq('request_id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({
                        success: false,
                        message: 'Request not found'
                    });
                }
                throw error;
            }

            // Broadcast real-time update
            if (sseEvents && sseEvents.broadcastToClients) {
                sseEvents.broadcastToClients('request-updated', {
                    request: data,
                    message: `Request ${data.request_id} status updated to ${data.status}`
                });
            }

            res.json({
                success: true,
                message: 'Request updated successfully',
                data
            });
        } else {
            // Mock data update
            const requestIndex = mockRequests.findIndex(req => req.request_id === id);

            if (requestIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found'
                });
            }

            mockRequests[requestIndex] = {
                ...mockRequests[requestIndex],
                ...updateData
            };

            // Broadcast real-time update
            if (sseEvents && sseEvents.broadcastToClients) {
                sseEvents.broadcastToClients('request-updated', {
                    request: mockRequests[requestIndex],
                    message: `Request ${mockRequests[requestIndex].request_id} status updated to ${mockRequests[requestIndex].status}`
                });
            }

            res.json({
                success: true,
                message: 'Request updated successfully',
                data: mockRequests[requestIndex]
            });
        }
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// DELETE /api/requests/:id - Delete request
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (supabase) {
            const { error } = await supabase
                .from('service_requests')
                .delete()
                .eq('request_id', id);

            if (error) {
                throw error;
            }

            // Broadcast real-time update
            if (sseEvents && sseEvents.broadcastToClients) {
                sseEvents.broadcastToClients('request-deleted', {
                    request_id: id,
                    message: `Request ${id} has been deleted`
                });
            }

            res.json({
                success: true,
                message: 'Request deleted successfully'
            });
        } else {
            // Mock data deletion
            const requestIndex = mockRequests.findIndex(req => req.request_id === id);

            if (requestIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found'
                });
            }

            mockRequests.splice(requestIndex, 1);

            // Broadcast real-time update
            if (sseEvents && sseEvents.broadcastToClients) {
                sseEvents.broadcastToClients('request-deleted', {
                    request_id: id,
                    message: `Request ${id} has been deleted`
                });
            }

            res.json({
                success: true,
                message: 'Request deleted successfully'
            });
        }
    } catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
    console.error('Request route error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error in requests router',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

module.exports = router;
