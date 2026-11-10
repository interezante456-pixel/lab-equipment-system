import { access, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const organization = 'interezante456-pixel';
const projectKey = 'interezante456-pixel_lab-equipment-system';
const outputDirectory = 'docs/sonarqube/evidencias/antes';
const issuesUrl = `https://sonarcloud.io/api/issues/search?${new URLSearchParams({
  organization,
  componentKeys: projectKey,
  resolved: 'false',
  ps: '100',
})}`;

const response = await fetch(issuesUrl);
if (!response.ok) throw new Error(`SonarCloud respondió HTTP ${response.status}.`);

const report = await response.json();
await mkdir(outputDirectory, { recursive: true });
await writeFile('docs/sonarqube/issues-before.json', JSON.stringify(report, null, 2));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  for (const [index, issue] of report.issues.entries()) {
    const capturePath = `${outputDirectory}/${String(index + 1).padStart(2, '0')}-${issue.key}.png`;
    if (await access(capturePath).then(() => true).catch(() => false)) continue;
    const issueUrl = `https://sonarcloud.io/project/issues?${new URLSearchParams({
      open: issue.key,
      id: projectKey,
    })}`;

    try {
      await page.goto(issueUrl, { waitUntil: 'networkidle', timeout: 30_000 });
      const cookieNotice = page.getByText('SonarSource Cookie Policy');
      if (await cookieNotice.isVisible().catch(() => false)) await page.keyboard.press('Escape');
      await page.getByText('Line affected').waitFor({ state: 'visible', timeout: 15_000 });
      await page.screenshot({ path: capturePath, clip: { x: 420, y: 220, width: 640, height: 310 } });
      console.log(`Captura ${index + 1}/${report.issues.length}: ${issue.key}`);
    } catch (error) {
      console.error(`Pendiente de evidencia ${issue.key}: ${error.message}`);
    }
  }
} finally {
  await browser.close();
}
