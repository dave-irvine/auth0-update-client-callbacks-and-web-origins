const core = require('@actions/core');
const ManagementClient = require('auth0').ManagementClient;

async function run() {
    try {
        const domain = core.getInput('domain', { required: true });
        const mgmt_client_id = core.getInput('mgmt_client_id', { required: true });
        const mgmt_client_secret = core.getInput('mgmt_client_secret', { required: true });
        const target_client_id = core.getInput('target_client_id', { required: true });
        const dryRunInput = core.getInput('dry_run', { required: false }) || 'false';

        const dryRun = dryRunInput && dryRunInput.toLowerCase() === 'true';

        const add_callbacksInput = core.getInput('add_callbacks', { required: false });
        const remove_callbacksInput = core.getInput('remove_callbacks', { required: false });
        const add_originsInput = core.getInput('add_origins', { required: false });
        const remove_originsInput = core.getInput('remove_origins', { required: false });

        const callbacksToAdd = add_callbacksInput.split(",") || [];
        const callbacksToRemove = remove_callbacksInput.split(",") || [];
        const originsToAdd = add_originsInput.split(",") || [];
        const originsToRemove = remove_originsInput.split(",") || [];

        const management = new ManagementClient({
            domain,
            clientId: mgmt_client_id,
            clientSecret: mgmt_client_secret,
        });

        const { callbacks, web_origins } = await management.getClient({ client_id: target_client_id });

        const callbacksSet = new Set(callbacks);
        const webOriginsSet = new Set(web_origins);

        core.debug(`Found these Callbacks: ${JSON.stringify([...callbacksSet])}`);
        core.debug(`Found these Web Origins: ${JSON.stringify([...webOriginsSet])}`);

        core.debug(`Adding these Callbacks: ${JSON.stringify(callbacksToAdd)}`);
        core.debug(`Removing these Callbacks: ${JSON.stringify(callbacksToRemove)}`);
        core.debug(`Adding these Web Origins: ${JSON.stringify(originsToAdd)}`);
        core.debug(`Removing these Web Origins: ${JSON.stringify(originsToRemove)}`);

        callbacksToAdd.forEach((callback) => {
            callbacksSet.add(callback);
        });

        callbacksToRemove.forEach((callback) => {
            callbacksSet.delete(callback);
        });

        originsToAdd.forEach((origin) => {
            webOriginsSet.add(origin);
        });

        originsToRemove.forEach((origin) => {
            webOriginsSet.delete(origin);
        });

        core.debug(`Updating these Callbacks: ${JSON.stringify([...callbacksSet])}`);
        core.debug(`Updating these Web Origins: ${JSON.stringify([...webOriginsSet])}`);

        if (!dryRun) {
            await management.updateClient({ client_id: target_client_id }, { callbacks: [...callbacksSet], web_origins: [...webOriginsSet] });
        }
    }
    catch (error) {
        core.setFailed(error.message);
        core.debug(error.stack);
    }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}