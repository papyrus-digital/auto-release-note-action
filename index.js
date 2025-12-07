const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const httpm = require('@actions/http-client');

const DISTRIBUTION_REPO = 'papyrus-digital/auto-release-cli-distribution';

async function run() {
  try {
    const apiKey = core.getInput('api_key', { required: true });
    const projectId = core.getInput('project_id', { required: true });
    const mode = core.getInput('mode') || 'tag';
    const template = core.getInput('template') || 'Standard Changelog';
    const outputUrl = core.getBooleanInput('output_url');
    const fromRef = sanitizeRef(core.getInput('from_ref'));
    const toRefInput = sanitizeRef(core.getInput('to_ref'));
    const cliVersion = (core.getInput('cli_version') || 'latest').trim();

    if (!apiKey) {
      throw new Error('⚠️ API Key missing! Please sign up at https://autoreleasenote.com to procure your key.');
    }

    if (!projectId) {
      throw new Error('⚠️ Project ID missing! Create a project at https://autoreleasenote.com to obtain one.');
    }

    const resolvedToRef = toRefInput || process.env.GITHUB_REF_NAME || '';
    if (!toRefInput && resolvedToRef) {
      core.info(`ℹ️ No to_ref provided. Defaulting to ${resolvedToRef} from GITHUB_REF_NAME.`);
    }

    const downloadInfo = await resolveCliDownload(cliVersion);

    core.info(`⬇️ Downloading Auto Release Note CLI (${downloadInfo.versionLabel})...`);
    const tarPath = await tc.downloadTool(downloadInfo.url);
    core.info('📦 Extracting archive...');
    const extractedPath = await tc.extractTar(tarPath);
    core.addPath(extractedPath);
    core.info('✅ CLI added to PATH.');

    const args = [
      'generate',
      '--non-interactive',
      '--mode', mode,
      '--template', template
    ];

    if (fromRef) {
      core.info(`Using from_ref: ${fromRef}`);
      args.push('--from', fromRef);
    }

    if (resolvedToRef) {
      core.info(`Using to_ref: ${resolvedToRef}`);
      args.push('--to', resolvedToRef);
    }

    if (outputUrl) {
      args.push('--output-url');
    }

    const env = {
      ...process.env,
      AUTO_RELEASE_TOKEN: apiKey,
      AUTO_RELEASE_PROJECT_ID: projectId
    };

    let stdOut = '';
    let stdErr = '';

    const options = {
      env,
      listeners: {
        stdout: (data) => {
          stdOut += data.toString();
        },
        stderr: (data) => {
          stdErr += data.toString();
        }
      }
    };

    core.info('🚀 Generating release notes...');
    await exec.exec('arn', args, options);

    const releaseUrl = parseReleaseUrl(stdOut);

    if (!releaseUrl) {
      if (stdErr) {
        core.warning(stdErr);
      }
      throw new Error('Auto Release Note CLI finished without returning a URL. Check the logs above for details.');
    }

    core.setOutput('release_url', releaseUrl);
    core.info(`🎉 Release notes ready: ${releaseUrl}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

function sanitizeRef(value) {
  return value ? value.trim() : '';
}

async function resolveCliDownload(cliVersion) {
  const version = (cliVersion || 'latest').trim();
  if (version.toLowerCase() !== 'latest') {
    const normalized = version.startsWith('v') ? version : `v${version}`;
    return {
      versionLabel: normalized,
      url: `https://github.com/${DISTRIBUTION_REPO}/releases/download/${normalized}/arn_${normalized}_linux_amd64.tar.gz`
    };
  }

  core.info('🔍 Finding latest CLI version...');
  const http = new httpm.HttpClient('auto-release-note-action');
  const releaseResponse = await http.getJson(`https://api.github.com/repos/${DISTRIBUTION_REPO}/releases/latest`);

  if (releaseResponse.statusCode !== 200) {
    throw new Error(`Failed to fetch latest release: ${releaseResponse.statusCode}`);
  }

  const latestRelease = releaseResponse.result;
  if (!latestRelease || !Array.isArray(latestRelease.assets)) {
    throw new Error('Latest release response did not include assets.');
  }

  const asset = latestRelease.assets.find(a => a.name && a.name.includes('linux_amd64.tar.gz'));
  if (!asset) {
    throw new Error('Could not find linux_amd64 binary in the latest release.');
  }

  return {
    versionLabel: latestRelease.tag_name || 'latest',
    url: asset.browser_download_url
  };
}

function parseReleaseUrl(buffer) {
  const lines = buffer
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  return lines.length ? lines[lines.length - 1] : '';
}

run();