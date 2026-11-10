import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const issueUrl = process.env.SONAR_ISSUE_URL;
const screenshotPath = process.env.SONAR_CAPTURE_PATH ?? 'docs/sonarqube/evidencias/sonar-issue.png';

test('captura una incidencia de SonarCloud', async ({ page }) => {
  test.skip(!issueUrl, 'Defina SONAR_ISSUE_URL con la URL de una incidencia antes de capturarla.');

  await page.goto(issueUrl!, { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/sonarcloud\.io/);

  const cookieNotice = page.getByText('SonarSource Cookie Policy');
  if (await cookieNotice.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
  }

  await expect(page.getByText('Line affected')).toBeVisible();
  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({
    path: screenshotPath,
    clip: { x: 420, y: 220, width: 640, height: 310 },
  });
});
