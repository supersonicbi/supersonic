export const HEALTH_DATA: any = {
    healthy: true,
    mode: 'demo',
    version: '0.1298.1',
    localDbtEnabled: true,
    isAuthenticated: true,
    requiresOrgRegistration: false,
    latest: {
        version: '0.1298.1',
    },
    rudder: {
        writeKey: '1u1wwlT1wrKltYqbctwmDRJk69M',
        dataPlaneUrl: 'https://analytics.lightdash.com',
    },
    sentry: {
        frontend: {
            dsn: '',
        },
        environment: 'demo',
        release: '0.1298.1',
        tracesSampleRate: 0.1,
        profilesSampleRate: 0.2,
    },
    intercom: {
        appId: 'zppxyjpp',
        apiBase: 'https://api-iam.intercom.io',
    },
    pylon: {
        appId: '',
    },
    siteUrl: 'https://demo.lightdash.com',
    staticIp: '',
    query: {
        maxLimit: 5000,
        csvCellsLimit: 100000,
    },
    pivotTable: {
        maxColumnLimit: 60,
    },
    customVisualizationsEnabled: false,
    hasSlack: false,
    hasGithub: false,
    auth: {
        disablePasswordAuthentication: false,
        google: {
            loginPath: '/login/google',
            enabled: false,
        },
        okta: {
            loginPath: '/login/okta',
            enabled: false,
        },
        oneLogin: {
            loginPath: '/login/oneLogin',
            enabled: false,
        },
        azuread: {
            loginPath: '/login/azuread',
            enabled: false,
        },
        oidc: {
            loginPath: '/login/oidc',
            enabled: false,
        },
    },
    hasEmailClient: false,
    hasHeadlessBrowser: false,
    hasGroups: false,
    hasExtendedUsageAnalytics: false,
};
