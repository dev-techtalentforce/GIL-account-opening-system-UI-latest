import packageInfo from '../../package.json';

export const environment = {
  hostURL: 'http://192.168.0.77/GLSAgentAPI/api',
  appVersion: packageInfo.version,
  production: true
};
