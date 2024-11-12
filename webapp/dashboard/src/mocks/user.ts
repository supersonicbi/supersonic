export const USER_DATA: any = {
    userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
    email: 'demo@lightdash.com',
    firstName: 'Rosie',
    lastName: 'Greenfingers',
    organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
    organizationName: 'Thyme to Shine Market',
    organizationCreatedAt: '2022-06-07T16:02:15.979Z',
    isTrackingAnonymized: false,
    isMarketingOptedIn: false,
    isSetupComplete: true,
    role: 'developer',
    isActive: true,
    abilityRules: [
        {
            action: 'view',
            subject: 'OrganizationMemberProfile',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'view',
            subject: 'CsvJobResult',
            conditions: {
                createdByUserUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
            },
        },
        {
            action: 'view',
            subject: 'PinnedItems',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'view',
            subject: 'Dashboard',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                isPrivate: false,
            },
        },
        {
            action: 'view',
            subject: 'SavedChart',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                isPrivate: false,
            },
        },
        {
            action: 'view',
            subject: 'Dashboard',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                    },
                },
            },
        },
        {
            action: 'view',
            subject: 'SavedChart',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                    },
                },
            },
        },
        {
            action: 'view',
            subject: 'Space',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                isPrivate: false,
            },
        },
        {
            action: 'view',
            subject: 'Space',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                    },
                },
            },
        },
        {
            action: 'view',
            subject: 'Project',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'view',
            subject: 'Organization',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'ExportCsv',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'view',
            subject: 'DashboardComments',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'create',
            subject: 'Project',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'create',
            subject: 'Job',
        },
        {
            action: 'view',
            subject: 'Job',
            conditions: {
                userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
            },
        },
        {
            action: 'view',
            subject: 'UnderlyingData',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'view',
            subject: 'SemanticViewer',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'ChangeCsvResults',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'Explore',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'create',
            subject: 'ScheduledDeliveries',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'create',
            subject: 'DashboardComments',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'Dashboard',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'editor',
                    },
                },
            },
        },
        {
            action: 'manage',
            subject: 'SavedChart',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'editor',
                    },
                },
            },
        },
        {
            action: 'manage',
            subject: 'SemanticViewer',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'editor',
                    },
                },
            },
        },
        {
            action: 'manage',
            subject: 'Dashboard',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'admin',
                    },
                },
            },
        },
        {
            action: 'manage',
            subject: 'SavedChart',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'admin',
                    },
                },
            },
        },
        {
            action: 'manage',
            subject: 'Space',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'admin',
                    },
                },
            },
        },
        {
            action: 'create',
            subject: 'Space',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'Job',
        },
        {
            action: 'manage',
            subject: 'PinnedItems',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'update',
            subject: 'Project',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'ScheduledDeliveries',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'DashboardComments',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'SemanticViewer',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'CustomSql',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'SqlRunner',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'manage',
            subject: 'Validation',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
        {
            action: 'promote',
            subject: 'SavedChart',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'editor',
                    },
                },
            },
        },
        {
            action: 'promote',
            subject: 'Dashboard',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
                access: {
                    $elemMatch: {
                        userUuid: '31e1df44-c1df-44d3-95b8-eedb90e776cf',
                        role: 'editor',
                    },
                },
            },
        },
        {
            action: 'manage',
            subject: 'CompileProject',
            conditions: {
                organizationUuid: 'e12c2f9f-6dc6-473d-be18-fdb4556c100d',
            },
        },
    ],
};
