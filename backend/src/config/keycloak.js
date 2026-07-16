const Keycloak = require('keycloak-connect');

const keycloak = new Keycloak({}, {
    clientId: '////',
    bearerOnly: true,
    serverUrl: 'https://labsys.frc.utn.edu.ar/aim',
    realm: 'dds-materia',
    credentials: {
        secret: '///'
    }
});

module.exports = { keycloak };
