const token = process.env.SONAR_TOKEN_T3;
const projectKey = 'interezante456-pixel_lab-equipment-system';
const organization = 'interezante456-pixel';
const sonarUrl = 'https://sonarcloud.io';

if (!token) {
  throw new Error('SONAR_TOKEN_T3 no está configurado en el entorno del proceso.');
}

function errorBodyOrStatus(response, body) {
  return body
    .replaceAll(token, '[REDACTED]')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]') || response.statusText;
}

const projectResponse = await fetch(
  `${sonarUrl}/api/projects/search?${new URLSearchParams({ organization, projects: projectKey, ps: '1' })}`,
  { headers: { Authorization: `Bearer ${token}` } },
);

if (!projectResponse.ok) {
  throw new Error(`La validación del proyecto respondió HTTP ${projectResponse.status}: ${errorBodyOrStatus(projectResponse, await projectResponse.text())}`);
}

const { components } = await projectResponse.json();
const project = components?.find((component) => component.key === projectKey);
if (!project) {
  throw new Error(`No se encontró el proyecto ${projectKey} en la organización ${organization}.`);
}

const response = await fetch(
  `${sonarUrl}/api/issues/search?${new URLSearchParams({ organization, componentKeys: projectKey, resolved: 'false', ps: '1' })}`,
  { headers: { Authorization: `Bearer ${token}` } },
);

if (!response.ok) {
  const errorBody = errorBodyOrStatus(response, await response.text());
  throw new Error(`La API de SonarCloud respondió HTTP ${response.status}: ${errorBody || response.statusText}`);
}

const { issues } = await response.json();
const [issue] = issues;

if (!issue) {
  console.log(`Proyecto verificado: ${project.key} (organización: ${organization}).`);
  console.log('No se encontraron incidencias abiertas para el proyecto.');
} else {
  console.log(JSON.stringify({ project: project.key, organization, key: issue.key, rule: issue.rule, component: issue.component, line: issue.line, status: issue.status }, null, 2));
}
