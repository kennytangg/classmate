export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ClassMate2026 API',
    version: '1.0.1',
    description: 'ClassMate2026 REST API - Student Community Platform. ',
  },
  servers: [
    { url: 'https://e2526-wads-b4ac.csbihub.id', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  tags: [
    { name: 'auth', description: 'Authentication — Firebase login and session logout' },
    { name: 'forums', description: 'Forum posts and replies with AI moderation' },
    { name: 'events', description: 'User event scheduling and persistence' },
    { name: 'recommendations', description: 'Personalized forum thread recommendations' },
    { name: 'materials', description: 'Study materials upload, listing, and download tracking' },
    { name: 'moderation', description: 'Moderation flagging and admin resolution workflows' },
    { name: 'study-groups', description: 'Study group management and messaging' },
    { name: 'ai', description: 'AI features: chat, moderation, summarization' },
    { name: 'messages', description: 'Direct user-to-user messaging' },
    { name: 'sessions', description: 'AI tutor chat sessions' },
    { name: 'connections', description: 'User connection requests and social graph' },
    { name: 'users', description: 'User discovery and public profiles' },
    { name: 'admin', description: 'Admin-only user management endpoints' },
    { name: 'user', description: 'User profile management' },
    { name: 'docs', description: 'API documentation and specification endpoints' },
    { name: 'health', description: 'Service health check' },
  ],
  security: [],
  paths: {
    // ==================== HEALTH ====================
    '/api/health': {
      get: {
        tags: ['health'],
        summary: 'Service health check',
        description:
          'Returns service status and database connectivity. Returns 503 when the database is unreachable.',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', description: 'Process uptime in seconds' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Service degraded — database unreachable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['degraded'] },
                    reason: { type: 'string', enum: ['db_unreachable'] },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== AUTH ====================
    '/api/auth/firebase': {
      post: {
        tags: ['auth'],
        summary: 'Firebase login',
        description:
          'Verifies a Firebase ID token and creates or updates the user in the database. ' +
          'Sets a `session` cookie (httpOnly, 1-hour TTL) on success.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Login successful — session cookie set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['success'] },
                    userId: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Missing, invalid, or expired Firebase ID token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },

    '/api/logout': {
      post: {
        tags: ['auth'],
        summary: 'Logout',
        description:
          'Clears both the `session` (Firebase) and `better-auth.session_token` cookies, effectively logging the user out.',
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Logged out' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== UPLOAD ====================
    '/api/upload': {
      post: {
        tags: ['ai'],
        summary: 'Upload a file (chat attachment)',
        description:
          'Accepts multipart/form-data with a single `file` field. ' +
          'Max size 10 MB. Allowed types: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP. ' +
          'Returns a public URL under `/uploads/chat/`.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload (max 10 MB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fileUrl: { type: 'string', description: 'Relative URL to the uploaded file' },
                    fileName: { type: 'string' },
                    fileType: { type: 'string' },
                    fileSize: { type: 'integer', description: 'Size in bytes' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'No file provided, file too large, or file type not allowed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Rate limit exceeded' },
          '500': { description: 'Upload failed' },
        },
      },
    },

    // ==================== FORUMS ====================
    '/api/forums/posts': {
      get: {
        tags: ['forums'],
        summary: 'List forum posts',
        description:
          'Returns all forum posts, optionally filtered by category. Posts are ordered by creation date descending.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            required: false,
            description: 'Filter posts by category (e.g., math, cs, physics)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Array of forum posts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ForumPost' },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['forums'],
        summary: 'Create a forum post',
        description:
          'Creates a new forum post. Content is automatically moderated using AI. ' +
          'Posts with toxic or spam content may be blocked or flagged with warnings.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content', 'category'],
                properties: {
                  title: { type: 'string', description: 'Post title' },
                  content: { type: 'string', description: 'Post content (plain text)' },
                  category: { type: 'string', description: 'Category (e.g., math, cs, physics)' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional tags for the post',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Post created successfully',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/ForumPost' },
                    {
                      type: 'object',
                      properties: {
                        post: { $ref: '#/components/schemas/ForumPost' },
                        warning: { $ref: '#/components/schemas/ModerationWarning' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Validation error or content blocked by moderation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    moderation: { $ref: '#/components/schemas/ModerationBlock' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - user not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/forums/replies': {
      get: {
        tags: ['forums'],
        summary: 'List replies for a post',
        description:
          'Returns all replies for a specific forum post, ordered by creation date ascending.',
        parameters: [
          {
            name: 'postId',
            in: 'query',
            required: true,
            description: 'ID of the forum post',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Array of forum replies',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ForumReply' },
                },
              },
            },
          },
          '400': {
            description: 'Missing postId parameter',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['forums'],
        summary: 'Create a reply to a post',
        description:
          'Creates a new reply on a forum post. Content is automatically moderated using AI. ' +
          'Increments the reply count on the parent post.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['postId', 'content'],
                properties: {
                  postId: { type: 'string', description: 'ID of the post to reply to' },
                  content: { type: 'string', description: 'Reply content' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Reply created successfully',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/ForumReply' },
                    {
                      type: 'object',
                      properties: {
                        reply: { $ref: '#/components/schemas/ForumReply' },
                        warning: { $ref: '#/components/schemas/ModerationWarning' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Validation error or content blocked by moderation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Post not found' },
        },
      },
    },

    '/api/forums/posts/{id}': {
      get: {
        tags: ['forums'],
        summary: 'Get forum post detail',
        description: 'Returns a single forum post by id and increments its view count.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Forum post detail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ForumPost' },
              },
            },
          },
          '404': { description: 'Post not found' },
          '500': { description: 'Internal server error' },
        },
      },
      delete: {
        tags: ['forums'],
        summary: 'Delete forum post',
        description: 'Deletes a forum post. Only owner or admin can delete.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Post deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Post not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/forums/replies/{id}': {
      delete: {
        tags: ['forums'],
        summary: 'Delete forum reply',
        description: 'Deletes a forum reply. Only owner or admin can delete.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Reply deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Reply not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/forums/posts/{id}/upvote': {
      post: {
        tags: ['forums'],
        summary: 'Toggle upvote on a forum post',
        description:
          'Toggles upvote for the authenticated user on the given post. Cannot upvote own post.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Upvote toggled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    upvoted: { type: 'boolean' },
                    upvotes: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Cannot upvote your own post' },
          '404': { description: 'Post not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/forums/replies/{id}/upvote': {
      post: {
        tags: ['forums'],
        summary: 'Toggle upvote on a forum reply',
        description:
          'Toggles upvote for the authenticated user on the given reply. Cannot upvote own reply.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Upvote toggled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    upvoted: { type: 'boolean' },
                    upvotes: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Cannot upvote your own reply' },
          '404': { description: 'Reply not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== MATERIALS ====================
    '/api/materials': {
      get: {
        tags: ['materials'],
        summary: 'List study materials',
        description: 'Returns study materials with optional subject/user filters and sorting.',
        parameters: [
          {
            name: 'subject',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'userId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['createdAt', 'downloads', 'rating'] },
          },
        ],
        responses: {
          '200': {
            description: 'Materials fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    materials: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/StudyMaterial' },
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['materials'],
        summary: 'Upload material metadata',
        description:
          'Creates a study material record with validation and sanitization for authenticated users.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'fileUrl', 'subject', 'fileType'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  fileUrl: { type: 'string' },
                  subject: { type: 'string' },
                  fileType: { type: 'string' },
                  fileSize: { type: 'number', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Material created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    material: { $ref: '#/components/schemas/StudyMaterial' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/materials/{id}': {
      get: {
        tags: ['materials'],
        summary: 'Get a study material',
        description: 'Returns a single study material by ID.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Material fetched',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { material: { $ref: '#/components/schemas/StudyMaterial' } },
                },
              },
            },
          },
          '404': { description: 'Material not found' },
          '500': { description: 'Internal server error' },
        },
      },
      patch: {
        tags: ['materials'],
        summary: 'Update a study material',
        description:
          'Updates title, description, or subject. Only the owner or a moderator can edit.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  subject: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Material updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { material: { $ref: '#/components/schemas/StudyMaterial' } },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Material not found' },
          '500': { description: 'Internal server error' },
        },
      },
      delete: {
        tags: ['materials'],
        summary: 'Delete a study material',
        description: 'Deletes a study material. Only the owner or a moderator can delete.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Material deleted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' } } },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Material not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/materials/{id}/download': {
      post: {
        tags: ['materials'],
        summary: 'Track material download',
        description: 'Increments download count and returns material download URL.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Download tracked',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    downloadUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Material not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== AI FEATURES ====================
    '/api/moderation': {
      post: {
        tags: ['ai'],
        summary: 'Moderate content using AI',
        description:
          'Analyzes content for toxicity, spam, and inappropriate material using Groq AI. ' +
          'Returns moderation scores and recommended action (approve, warn, or block).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', description: 'Content to analyze' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Moderation result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ModerationResult' },
              },
            },
          },
          '400': {
            description: 'Missing content',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'AI service error' },
        },
      },
    },

    '/api/summarize': {
      post: {
        tags: ['ai'],
        summary: 'Summarize a discussion thread',
        description:
          'Generates a concise 2-3 sentence summary of a discussion thread using Groq AI. ' +
          'Useful for quickly understanding long forum threads.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['thread'],
                properties: {
                  thread: { type: 'string', description: 'Thread content to summarize' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Summary result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: { type: 'string', description: '2-3 sentence summary' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing thread content',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'AI service error' },
        },
      },
    },

    '/api/chat': {
      post: {
        tags: ['ai'],
        summary: 'AI tutor chat (streaming)',
        description:
          'Sends messages to the AI tutor and receives streaming responses. ' +
          'Uses Groq LLaMA 3.3 70B model for intelligent tutoring assistance.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' },
                      },
                    },
                    description: 'Conversation history',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Streaming response (text/event-stream)',
            content: {
              'text/event-stream': {
                schema: { type: 'string' },
              },
            },
          },
          '400': { description: 'Invalid messages format' },
          '500': { description: 'AI service error' },
        },
      },
    },

    // ==================== EVENTS ====================
    '/api/events': {
      get: {
        tags: ['events'],
        summary: 'List current user events',
        description: 'Returns events for the authenticated user ordered by date and creation time.',
        responses: {
          '200': {
            description: 'Events fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    events: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['events'],
        summary: 'Create an event',
        description:
          'Creates a new event for the authenticated user with input validation and sanitization.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'date'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  date: { type: 'string', format: 'date-time' },
                  startTime: { type: 'string', nullable: true },
                  endTime: { type: 'string', nullable: true },
                  category: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Event created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    event: { $ref: '#/components/schemas/Event' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/events/{id}': {
      patch: {
        tags: ['events'],
        summary: 'Update an event',
        description: 'Updates an existing event. Only owner or admin can update.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  date: { type: 'string', format: 'date-time' },
                  startTime: { type: 'string', nullable: true },
                  endTime: { type: 'string', nullable: true },
                  category: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    event: { $ref: '#/components/schemas/Event' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid payload' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Event not found' },
          '500': { description: 'Internal server error' },
        },
      },
      delete: {
        tags: ['events'],
        summary: 'Delete an event',
        description: 'Deletes an event. Only owner or admin can delete.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Event deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Event not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== RECOMMENDATIONS ====================
    '/api/recommendations/threads': {
      get: {
        tags: ['recommendations'],
        summary: 'Get recommended forum threads',
        description:
          'Returns top recommended forum threads for the authenticated user with explainable reason labels and fallback mode when history is sparse.',
        responses: {
          '200': {
            description: 'Recommendations fetched successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ThreadRecommendationsResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // ==================== MODERATION WORKFLOW ====================
    '/api/moderation/flag': {
      post: {
        tags: ['moderation'],
        summary: 'Flag content for moderation',
        description: 'Allows authenticated users to flag posts, replies, or materials for review.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['contentType', 'contentId', 'reason'],
                properties: {
                  contentType: { type: 'string', enum: ['post', 'reply', 'material'] },
                  contentId: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Content flagged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    flag: { $ref: '#/components/schemas/FlaggedContent' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Content not found' },
          '409': { description: 'Already flagged by user' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/moderation/flagged': {
      get: {
        tags: ['moderation'],
        summary: 'List flagged content (admin)',
        description: 'Returns flagged content queue for moderation admin review.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['pending', 'resolved', 'dismissed'] },
          },
        ],
        responses: {
          '200': {
            description: 'Flags fetched',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    flags: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FlaggedContent' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/moderation/resolve': {
      post: {
        tags: ['moderation'],
        summary: 'Resolve moderation flag (admin)',
        description: 'Allows admin to dismiss, remove, or warn on a flagged content record.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['flagId', 'action'],
                properties: {
                  flagId: { type: 'string' },
                  action: { type: 'string', enum: ['dismiss', 'remove', 'warn'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Flag resolved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    flag: { $ref: '#/components/schemas/FlaggedContent' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Flag not found' },
          '409': { description: 'Flag already resolved' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/moderation/logs': {
      get: {
        tags: ['moderation'],
        summary: 'List moderation audit logs (moderator/admin)',
        description:
          'Returns paginated moderation audit logs. Admins see all logs; moderators see only their own.',
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
          {
            name: 'action',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['FLAG_CREATED', 'FLAG_RESOLVED', 'CONTENT_DELETED'],
            },
          },
          {
            name: 'startDate',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'endDate',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': {
            description: 'Logs fetched',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    logs: { type: 'array', items: { $ref: '#/components/schemas/ModerationLog' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid filter parameters' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== STUDY GROUPS ====================
    '/api/study-groups': {
      get: {
        tags: ['study-groups'],
        summary: 'List study groups',
        description: 'Returns all public study groups or groups the user is a member of.',
        responses: {
          '200': {
            description: 'Array of study groups',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    groups: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/StudyGroup' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['study-groups'],
        summary: 'Create a study group',
        description: 'Creates a new study group.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'subject'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  subject: { type: 'string' },
                  maxMembers: { type: 'integer' },
                  isPrivate: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Group created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StudyGroup' },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['study-groups'],
        summary: 'Delete a study group',
        description: 'Deletes a study group. Only the owner can delete.',
        parameters: [
          {
            name: 'groupId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Group deleted' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not the group owner' },
          '404': { description: 'Group not found' },
        },
      },
    },

    '/api/study-groups/{groupId}': {
      get: {
        tags: ['study-groups'],
        summary: 'Get study group detail',
        description:
          'Returns a single study group with members. Includes flags indicating whether the current user is a member or owner.',
        parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Study group detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StudyGroup' },
                    {
                      type: 'object',
                      properties: {
                        isCurrentUserMember: { type: 'boolean' },
                        isCurrentUserOwner: { type: 'boolean' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Group not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/study-groups/{groupId}/join': {
      post: {
        tags: ['study-groups'],
        summary: 'Join a study group',
        description: 'Adds the current user as a member.',
        parameters: [
          {
            name: 'groupId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Successfully joined' },
          '400': { description: 'Already a member or group full' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Group not found' },
        },
      },
      delete: {
        tags: ['study-groups'],
        summary: 'Leave a study group',
        description: 'Removes the current user from the group.',
        parameters: [
          {
            name: 'groupId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Successfully left' },
          '400': { description: 'Not a member or is owner' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/api/study-groups/{groupId}/messages': {
      get: {
        tags: ['study-groups'],
        summary: 'Get group messages',
        description:
          'Returns paginated message history for a study group. ' +
          'Messages are ordered oldest-first within the page. ' +
          'Use the `nextCursor` from the response to fetch older messages.',
        parameters: [
          {
            name: 'groupId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Page size (default 50, max 100)',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
          {
            name: 'cursor',
            in: 'query',
            required: false,
            description: 'ISO timestamp cursor — returns messages older than this value',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': {
            description: 'Group info, messages, and pagination cursor',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    group: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        subject: { type: 'string' },
                        memberCount: { type: 'integer' },
                        ownerId: { type: 'string' },
                      },
                    },
                    messages: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/GroupMessage' },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        limit: { type: 'integer' },
                        nextCursor: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                          description:
                            'Pass as `cursor` to fetch older messages; null when exhausted',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid cursor value' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not a group member' },
          '404': { description: 'Group not found' },
          '500': { description: 'Internal server error' },
        },
      },
      post: {
        tags: ['study-groups'],
        summary: 'Send a group message',
        description:
          'Posts a message to the study group. ' +
          'Either `content` or a file attachment (`fileUrl`) must be provided.',
        parameters: [
          {
            name: 'groupId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    description: 'Message text (may be empty if fileUrl is set)',
                  },
                  fileUrl: {
                    type: 'string',
                    nullable: true,
                    description: 'URL of an uploaded attachment',
                  },
                  fileName: { type: 'string', nullable: true },
                  fileType: { type: 'string', nullable: true },
                  fileSize: { type: 'integer', nullable: true, description: 'File size in bytes' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Message sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { $ref: '#/components/schemas/GroupMessage' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error or empty message (no text and no file)' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not a group member' },
          '404': { description: 'Group not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== SESSIONS ====================
    '/api/sessions': {
      get: {
        tags: ['sessions'],
        summary: 'List AI chat sessions',
        description: 'Returns all chat sessions for the authenticated user.',
        responses: {
          '200': {
            description: 'Array of sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ChatSession' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['sessions'],
        summary: 'Create a chat session',
        description: 'Creates a new AI tutor chat session.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', default: 'Chat Session' },
                  subject: { type: 'string', default: 'General' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Session created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatSession' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['sessions'],
        summary: 'Delete a chat session',
        description: 'Deletes a chat session and all its messages.',
        parameters: [
          {
            name: 'sessionId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Session deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Session not found' },
        },
      },
    },

    '/api/sessions/{sessionId}/messages': {
      get: {
        tags: ['sessions'],
        summary: 'Get session messages',
        description: 'Returns all messages in a chat session.',
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Array of messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messages: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ChatMessage' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Session not found' },
        },
      },
    },

    // ==================== DIRECT MESSAGES ====================
    '/api/messages/conversations': {
      get: {
        tags: ['messages'],
        summary: 'List direct-message conversations',
        description:
          'Returns conversation summaries for the authenticated user, including participant info, last message preview, and unread count.',
        responses: {
          '200': {
            description: 'Conversation list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    conversations: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ConversationSummary' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/messages/conversations/{userId}': {
      get: {
        tags: ['messages'],
        summary: 'Get direct-message thread',
        description:
          'Returns paginated direct messages between authenticated user and target participant.',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Page size (default 50, max 100)',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
          {
            name: 'cursor',
            in: 'query',
            required: false,
            description: 'ISO timestamp cursor for older messages',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': {
            description: 'Thread and participant metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    participant: { $ref: '#/components/schemas/DirectMessageParticipant' },
                    messages: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DirectMessage' },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        limit: { type: 'integer' },
                        nextCursor: { type: 'string', format: 'date-time', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid userId or cursor value' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Target user not found' },
        },
      },
      post: {
        tags: ['messages'],
        summary: 'Send a direct message',
        description: 'Creates a new direct message to the target user.',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Message created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { $ref: '#/components/schemas/DirectMessage' },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing/invalid content' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Target user not found' },
        },
      },
    },

    '/api/messages/conversations/{userId}/read': {
      post: {
        tags: ['messages'],
        summary: 'Mark direct messages as read',
        description:
          'Marks unread incoming messages from target user as read for the authenticated user.',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Updated read state',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    updatedCount: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid userId' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Target user not found' },
        },
      },
    },

    // ==================== MESSAGES CONTACTS ====================
    '/api/messages/contacts': {
      get: {
        tags: ['messages'],
        summary: 'List messageable contacts',
        description:
          'Returns all users (except the caller) available to start a direct message thread with.',
        responses: {
          '200': {
            description: 'Contact list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    contacts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DirectMessageParticipant' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== CONNECTIONS ====================
    '/api/connections': {
      get: {
        tags: ['connections'],
        summary: 'List connections',
        description:
          'Returns connections for the authenticated user. Filter by status: accepted (default), pending_received, pending_sent.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['accepted', 'pending_received', 'pending_sent'],
              default: 'accepted',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Connections fetched',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    connections: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Connection' },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid status filter' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
      post: {
        tags: ['connections'],
        summary: 'Send a connection request',
        description:
          'Sends a connection request to another user. If the other user has already requested, auto-accepts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientId'],
                properties: {
                  recipientId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Mutual request auto-accepted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { connection: { $ref: '#/components/schemas/Connection' } },
                },
              },
            },
          },
          '201': {
            description: 'Connection request sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { connection: { $ref: '#/components/schemas/Connection' } },
                },
              },
            },
          },
          '400': { description: 'Invalid recipientId or self-connection attempt' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Recipient user not found' },
          '409': { description: 'Already connected or request already sent' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/connections/{id}': {
      patch: {
        tags: ['connections'],
        summary: 'Accept or reject a connection request',
        description: 'Only the recipient of the request can accept or reject it.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['ACCEPTED', 'REJECTED'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Connection updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { connection: { $ref: '#/components/schemas/Connection' } },
                },
              },
            },
          },
          '400': { description: 'Invalid status value' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — not the recipient' },
          '404': { description: 'Connection not found' },
          '409': { description: 'Request no longer pending' },
          '500': { description: 'Internal server error' },
        },
      },
      delete: {
        tags: ['connections'],
        summary: 'Remove a connection',
        description: 'Either the sender or recipient may remove an existing connection.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Connection removed',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' } } },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Connection not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/connections/status': {
      get: {
        tags: ['connections'],
        summary: 'Get connection status with a user',
        description:
          'Returns the connection status between the authenticated user and a target user.',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: true,
            description: 'Target user ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Connection status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['none', 'pending_sent', 'pending_received', 'accepted'],
                    },
                    connectionId: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing userId' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/connections/count': {
      get: {
        tags: ['connections'],
        summary: 'Get connection count',
        description:
          'Returns the number of accepted connections for the given user (defaults to the authenticated user).',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: false,
            description: 'User ID (defaults to authenticated user)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Connection count',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { count: { type: 'integer' } } },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== USERS ====================
    '/api/users/discover': {
      get: {
        tags: ['users'],
        summary: 'Discover users',
        description:
          'Returns paginated list of users (excluding the caller) with connection status attached. Supports search by name, university, or major.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User discovery results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DiscoverUser' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        pages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== ADMIN ====================
    '/api/admin/users': {
      get: {
        tags: ['admin'],
        summary: 'List all users (admin)',
        description: 'Returns paginated user list with search. Requires admin role.',
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Users fetched',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    users: { type: 'array', items: { $ref: '#/components/schemas/AdminUser' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/admin/users/{id}/role': {
      patch: {
        tags: ['admin'],
        summary: 'Change a user role (admin)',
        description:
          'Updates the role of a user. Admins can assign STUDENT or MODERATOR. OWNER role cannot be modified.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['STUDENT', 'MODERATOR', 'ADMIN'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Role updated',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' } } },
              },
            },
          },
          '400': { description: 'Invalid role or self-modification attempt' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'User not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    // ==================== USER ====================
    '/api/user/me': {
      get: {
        tags: ['user'],
        summary: 'Get current user',
        description:
          "Returns the authenticated user's id, email, name, image, role, and avatarUrl.",
        responses: {
          '200': {
            description: 'Current user data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string', nullable: true },
                    image: { type: 'string', nullable: true },
                    role: { type: 'string', enum: ['STUDENT', 'MODERATOR', 'ADMIN', 'OWNER'] },
                    avatarUrl: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/user/stats': {
      get: {
        tags: ['user'],
        summary: 'Get user statistics',
        description:
          'Returns forum post count, study group memberships, and connection count. Defaults to authenticated user; pass userId for public profile views.',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: false,
            description: 'Target user ID (defaults to authenticated user)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    forumPostCount: { type: 'integer' },
                    studyGroupCount: { type: 'integer' },
                    connectionCount: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized (when no userId and no session)' },
          '500': { description: 'Internal server error' },
        },
      },
    },

    '/api/user/profile': {
      get: {
        tags: ['user'],
        summary: 'Get user profile',
        description: 'Returns the profile for the authenticated user.',
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['user'],
        summary: 'Update user profile',
        description: 'Updates profile fields for the authenticated user.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string' },
                  bio: { type: 'string' },
                  avatarUrl: { type: 'string' },
                  university: { type: 'string' },
                  major: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ==================== DOCS ====================
    '/api/docs': {
      get: {
        tags: ['docs'],
        summary: 'OpenAPI specification',
        description: 'Returns the OpenAPI JSON specification for this API.',
        responses: {
          '200': {
            description: 'OpenAPI spec',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID token',
        description:
          'Firebase ID token obtained from the client SDK. Used only for /api/auth/firebase.',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description:
          'Session cookie set after Firebase login. All authenticated endpoints use this.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },

      // Forum Schemas
      ForumPost: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          category: { type: 'string' },
          upvotes: { type: 'integer', default: 0 },
          views: { type: 'integer', default: 0 },
          isAnswered: { type: 'boolean', default: false },
          repliesCount: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/UserSummary' },
          tags: {
            type: 'array',
            items: { $ref: '#/components/schemas/ForumTag' },
          },
        },
      },

      ForumReply: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          postId: { type: 'string' },
          userId: { type: 'string' },
          content: { type: 'string' },
          upvotes: { type: 'integer', default: 0 },
          isAccepted: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/UserSummary' },
        },
      },

      ForumTag: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },

      StudyMaterial: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          fileUrl: { type: 'string' },
          subject: { type: 'string' },
          fileType: { type: 'string' },
          downloads: { type: 'integer' },
          rating: { type: 'number' },
          reviewCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/UserSummary' },
        },
      },

      Event: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          date: { type: 'string', format: 'date-time' },
          startTime: { type: 'string', nullable: true },
          endTime: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      ThreadRecommendation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          upvotes: { type: 'integer' },
          views: { type: 'integer' },
          repliesCount: { type: 'integer' },
          reason: { type: 'string' },
          score: { type: 'number' },
        },
      },

      ThreadRecommendationsResponse: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: { $ref: '#/components/schemas/ThreadRecommendation' },
          },
          fallbackUsed: { type: 'boolean' },
        },
      },

      // Moderation Schemas
      ModerationResult: {
        type: 'object',
        properties: {
          safe: { type: 'boolean', description: 'Whether content is safe' },
          toxicity_score: { type: 'integer', minimum: 0, maximum: 100 },
          spam_score: { type: 'integer', minimum: 0, maximum: 100 },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Detected categories (harassment, hate_speech, spam, etc.)',
          },
          action: {
            type: 'string',
            enum: ['approve', 'warn', 'block'],
            description: 'Recommended action',
          },
          reason: { type: 'string', description: 'Explanation of the decision' },
        },
      },

      ModerationWarning: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          reason: { type: 'string' },
          categories: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },

      ModerationBlock: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['block'] },
          reason: { type: 'string' },
          categories: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },

      FlaggedContent: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reporterId: { type: 'string' },
          contentType: { type: 'string', enum: ['post', 'reply', 'material'] },
          contentId: { type: 'string' },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'resolved', 'dismissed'] },
          resolvedBy: { type: 'string', nullable: true },
          resolution: { type: 'string', nullable: true },
          resolvedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      ModerationLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          actorId: { type: 'string' },
          action: { type: 'string', enum: ['FLAG_CREATED', 'FLAG_RESOLVED', 'CONTENT_DELETED'] },
          targetId: { type: 'string', nullable: true },
          targetType: { type: 'string', nullable: true },
          details: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          actor: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string', nullable: true },
            },
          },
        },
      },

      // Study Group Schemas
      StudyGroup: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ownerId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          subject: { type: 'string' },
          maxMembers: { type: 'integer', nullable: true },
          isPrivate: { type: 'boolean', default: false },
          inviteCode: { type: 'string', nullable: true },
          memberCount: { type: 'integer', default: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          owner: { $ref: '#/components/schemas/UserSummary' },
          members: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudyGroupMember' },
          },
        },
      },

      StudyGroupMember: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          groupId: { type: 'string' },
          userId: { type: 'string' },
          role: { type: 'string', default: 'member' },
          joinedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/UserSummary' },
        },
      },

      GroupMessage: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          senderId: { type: 'string' },
          content: { type: 'string' },
          fileUrl: { type: 'string', nullable: true, description: 'URL of an attached file' },
          fileName: { type: 'string', nullable: true },
          fileType: { type: 'string', nullable: true },
          fileSize: { type: 'integer', nullable: true, description: 'File size in bytes' },
          createdAt: { type: 'string', format: 'date-time' },
          sender: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              displayName: {
                type: 'string',
                description: 'Resolved display name (profile > name > email)',
              },
              avatarUrl: { type: 'string', nullable: true },
            },
          },
        },
      },

      // Chat/Session Schemas
      ChatSession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string', default: 'Chat Session' },
          subject: { type: 'string', default: 'General' },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      ChatMessage: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sessionId: { type: 'string' },
          senderId: { type: 'string' },
          content: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      DirectMessageParticipant: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          displayName: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', nullable: true },
        },
      },

      DirectMessage: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          senderId: { type: 'string' },
          recipientId: { type: 'string' },
          content: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      ConversationSummary: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          participant: { $ref: '#/components/schemas/DirectMessageParticipant' },
          lastMessage: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              senderId: { type: 'string' },
            },
          },
          unreadCount: { type: 'integer' },
        },
      },

      // User Schemas
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          displayName: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', nullable: true },
          university: { type: 'string', nullable: true },
          major: { type: 'string', nullable: true },
          reputation: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      UserSummary: {
        type: 'object',
        description: 'Minimal user info for embedding in other objects',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          profile: {
            type: 'object',
            properties: {
              displayName: { type: 'string', nullable: true },
              major: { type: 'string', nullable: true },
            },
          },
        },
      },

      Connection: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          senderId: { type: 'string' },
          recipientId: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          sender: { $ref: '#/components/schemas/UserSummary' },
          recipient: { $ref: '#/components/schemas/UserSummary' },
        },
      },

      DiscoverUser: {
        type: 'object',
        description: 'User returned by the discover endpoint, with connection status attached',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', nullable: true },
          image: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['STUDENT', 'MODERATOR', 'ADMIN', 'OWNER'] },
          profile: {
            type: 'object',
            nullable: true,
            properties: {
              displayName: { type: 'string', nullable: true },
              avatarUrl: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              university: { type: 'string', nullable: true },
              major: { type: 'string', nullable: true },
            },
          },
          connectionStatus: {
            type: 'string',
            enum: ['none', 'pending_sent', 'pending_received', 'accepted'],
          },
          connectionId: { type: 'string', nullable: true },
        },
      },

      AdminUser: {
        type: 'object',
        description: 'User record as returned by admin endpoints',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['STUDENT', 'MODERATOR', 'ADMIN', 'OWNER'] },
          createdAt: { type: 'string', format: 'date-time' },
          profile: {
            type: 'object',
            nullable: true,
            properties: {
              displayName: { type: 'string', nullable: true },
              avatarUrl: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  },
}
