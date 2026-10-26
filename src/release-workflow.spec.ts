import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Releases are created by hand on GitHub, and publishing one deploys its tag (ADR 0022). Nothing in the code
 * exercises the workflow, so these tests keep it saying what the ADRs say: what starts it, which tag it accepts,
 * what it builds from, and where the Vercel token goes.
 */
const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const workflow = read('.github/workflows/release.yml');

const vercelJob = workflow.slice(workflow.indexOf('  vercel:'), workflow.indexOf('  image:'));

/** The pattern of the tag guard in the workflow: `[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]`. */
const tagGuard = () => {
  const source = /\[\[ "\$TAG" =~ (\S+) \]\]/.exec(workflow)?.[1];
  expect(source, 'the workflow checks the tag').toBeDefined();
  return new RegExp(source as string);
};

describe('release workflow', () => {
  it('starts when a release is published, or by hand for a tag that already exists', () => {
    expect(workflow).toMatch(
      /\non:\n[ ]{2}release:\n[ ]{4}types: \[published\]\n[ ]{2}workflow_dispatch:/,
    );
  });

  it('does not start on a push: a merge to main deploys nothing', () => {
    expect(workflow).not.toMatch(/\n[ ]{2}push:/);
  });

  it('is not driven by release-please any more', () => {
    expect(workflow).not.toContain('release-please');
    expect(existsSync(join(root, 'release-please-config.json'))).toBe(false);
    expect(existsSync(join(root, '.release-please-manifest.json'))).toBe(false);
  });

  it('only accepts a tag that looks like vX.Y.Z', () => {
    const guard = tagGuard();

    expect(guard.test('v1.0.0')).toBe(true);
    expect(guard.test('v12.34.56')).toBe(true);
    expect(guard.test('1.0.0')).toBe(false);
    expect(guard.test('onerpm-tracks-v1.0.0')).toBe(false);
    expect(guard.test('v1.2.3-beta.1')).toBe(false);
    expect(guard.test('v1.2.3\nsomething')).toBe(false);
  });

  it('takes the tag from the release, or from the input of a manual run, through the environment', () => {
    expect(
      workflow.match(/TAG: \$\{\{ github\.event\.release\.tag_name \|\| inputs\.tag \}\}/g),
    ).toHaveLength(2);
    // The tag is user-controlled text: it never goes straight into a script.
    expect(workflow).not.toMatch(/run:[^\n]*\$\{\{ *(github\.event\.release|inputs)/);
  });

  it('builds from the tag, not from the branch, in both jobs', () => {
    expect(workflow.match(/ref: refs\/tags\/\$\{\{ env\.TAG \}\}/g)).toHaveLength(2);
  });

  it('skips pre-releases, in the Vercel deploy and in the image, under the same condition', () => {
    const conditions = workflow.match(/\n[ ]{4}if: .*\n/g) ?? [];

    expect(conditions).toHaveLength(2);
    expect(conditions[0]).toBe(conditions[1]);
    expect(conditions[0]).toContain('!github.event.release.prerelease');
  });

  it('deploys to Vercel with a pinned CLI version', () => {
    expect(workflow).toMatch(/VERCEL_CLI: vercel@\d+\.\d+\.\d+\n/);
    expect(workflow).toContain('deploy --prebuilt --prod');
  });

  it('gives the Vercel token only to the two steps that talk to Vercel, never to the build or the whole job', () => {
    const jobSettings = vercelJob.slice(0, vercelJob.indexOf('    steps:'));

    expect(jobSettings).not.toContain('VERCEL_TOKEN');
    expect(vercelJob.match(/VERCEL_TOKEN: \$\{\{ secrets\.VERCEL_TOKEN \}\}/g)).toHaveLength(2);
    expect(workflow.match(/secrets\.VERCEL_TOKEN/g)).toHaveLength(2);
    expect(workflow).not.toContain('--token');
  });

  it('needs no token of its own to publish the image or to create the release', () => {
    expect(workflow).not.toContain('RELEASE_PLEASE_TOKEN');
    expect(workflow).toContain('password: ${{ secrets.GITHUB_TOKEN }}');
  });
});
