import { expect, test } from '@playwright/test'

/**
 * Real-browser smoke (chromium project, runs in CI): the reader-facing
 * spine renders and navigates. Deep interaction coverage (focus mode,
 * narrator, up-next sheet) belongs in dedicated specs once this spine
 * is green in CI.
 */

test('homepage renders the Nepali front page', async ({ page }) => {
  await page.goto('/ne')
  await expect(page).toHaveTitle(/नागरिक|Nagarik/)
  // Masthead + at least one story link into a category/slug route.
  await expect(page.locator('header').first()).toBeVisible()
  const storyLink = page.locator('main a[href^="/ne/"][href*="/"]').first()
  await expect(storyLink).toBeVisible()
})

test('story hop: front page to article page', async ({ page }) => {
  await page.goto('/ne/latest')
  const article = page
    .locator('main a[href^="/ne/"]')
    .filter({ hasNot: page.locator('[href$="/latest"]') })
    .first()
  await expect(article).toBeVisible()
  await article.click()
  await expect(page.locator('main h1').first()).toBeVisible()
})

test('login page shows the reader form with accessible fields', async ({ page }) => {
  await page.goto('/ne/login')
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
  const submit = page.locator('button[type="submit"]').first()
  await expect(submit).toBeVisible()
  // ui-audit: primary tap target must be >= 44px tall.
  const box = await submit.boundingBox()
  expect(box, 'submit button must have a bounding box').toBeTruthy()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('anonymous account visit lands on login (login-first policy)', async ({ page }) => {
  await page.goto('/ne/account')
  await expect(page).toHaveURL(/\/ne\/login/)
})

test('search page renders with the autocomplete combobox', async ({ page }) => {
  await page.goto('/ne/search')
  await expect(page.locator('[role="combobox"], input[type="search"]').first()).toBeVisible()
})
