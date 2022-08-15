import { createSecretKey } from 'node:crypto';
import {
  AppSyncClient,
  CreateApiKeyCommand
} from '@aws-sdk/client-appsync';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import dayjs from 'dayjs';
import { awsClientConfig } from '@thriving-artist/lambda-utils';

export const handler = async (event: any, context) => {
  console.info('EVENT: ', event);
  console.info('CONTEXT: ', context);
  const { Step , SecretId, ClientRequestToken: token } = event;
  const { AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN, AWS_ACCESS_KEY_ID, AWS_REGION } = process.env;
  const serviceClient = new SecretsManagerClient(awsClientConfig());
  const describeSecret = await serviceClient.send(
    new DescribeSecretCommand({
      SecretId,
    })
  );

  if (describeSecret.RotationEnabled === false) {
    throw new Error(`Secret ${SecretId} is not enabled for rotation`);
  }
  const versions = describeSecret.VersionIdsToStages;
  if (!versions) {
    throw new Error(
      `Secret version ${token} has no stage for rotation of secret ${SecretId}.`
    );
  }
  if (versions[token].includes('AWSCURRENT')) {
    console.info(
      `Secret version ${token} already set as AWSCURRENT for secret ${SecretId}.`
    );
    return;
  } else if (!versions[token].includes('AWSPENDING')) {
    throw new Error(
      `Secret version ${token} not set as AWSPENDING for rotation of secret ${SecretId}.`
    );
  }

  return await {
    createSecret,
    setSecret,
    testSecret,
    finishSecret,
  }[Step](serviceClient, SecretId, token);
};

export async function createSecret(
  serviceClient: any,
  arn: string,
  token: string
) {
  const { API_ARN: apiArn, API_ID: apiId, API_URL: apiUrl } = process.env;
  const currentDict = await getSecretDict(serviceClient, arn, 'AWSCURRENT');
  try {
    const pendingDict = await getSecretDict(serviceClient, arn, 'AWSPENDING');
    console.info(`createSecret: Successfully retrieved secret for ${arn}.`);
  } catch (err) {
    if (err) {
      // resource not found?
      //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appsync/classes/createapikeycommand.html

      const { AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN, AWS_ACCESS_KEY_ID, AWS_REGION } = process.env;
      const appsyncClient = new AppSyncClient(awsClientConfig());
      const { apiKey : { id : apiKey } } = await appsyncClient.send(
        new CreateApiKeyCommand({
          apiId: apiId,
          description: '',
          expires: dayjs().add(31, 'day').valueOf()/1000,
        })
      );
      const secretValue = {
        apiId,
        apiKey,
        apiUrl,
        apiArn,
      };
      await serviceClient.send(
        new PutSecretValueCommand({
          SecretId: arn,
          ClientRequestToken: token,
          SecretString: JSON.stringify(secretValue),
          VersionStages: ['AWSCURRENT'],//['AWSPENDING'],
        })
      );
      console.info(`createSecret: Successfully put secret for ARN ${arn} and version ${token}.`)
    }
  }
}

export async function setSecret(
  serviceClient: any,
  arn: string,
  token: string
) {
  // do nothing, here as a place holder
}

export async function testSecret(
  serviceClient: any,
  arn: string,
  token: string
) {
  // do nothing, here as a place holder
}

export async function finishSecret(
  serviceClient: any,
  arn: string,
  token: string
) {
  // def finish_secret(service_client, arn, token):
  // """Finish the rotation by marking the pending secret as current
  // This method moves the secret from the AWSPENDING stage to the AWSCURRENT stage.
  // Args:
  //     service_client (client): The secrets manager service client
  //     arn (string): The secret ARN or other identifier
  //     token (string): The ClientRequestToken associated with the secret version
  // Raises:
  //     ResourceNotFoundException: If the secret with the specified arn and stage does not exist
  // """
  // # First describe the secret to get the current version
  // metadata = service_client.describe_secret(SecretId=arn)
  // current_version = None
  // for version in metadata["VersionIdsToStages"]:
  //     if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
  //         if version == token:
  //             # The correct version is already marked as current, return
  //             logger.info("finishSecret: Version %s already marked as AWSCURRENT for %s" % (version, arn))
  //             return
  //         current_version = version
  //         break
  // # Finalize by staging the secret version current
  // service_client.update_secret_version_stage(SecretId=arn, VersionStage="AWSCURRENT", MoveToVersionId=token, RemoveFromVersionId=current_version)
  // logger.info("finishSecret: Successfully set AWSCURRENT stage to version %s for secret %s." % (token, arn))
}

export async function getSecretDict(
  serviceClient: any,
  arn: string,
  stage: string | null | undefined,
  token: string | null | undefined = null
) {
  const secretValue = await serviceClient.send(
    new GetSecretValueCommand({
      SecretId: arn,
      VersionId: token,
      VersionStage: stage,
    })
  );
  const plaintext = secretValue.SecretString;
  try {
    const secretDict = JSON.parse(plaintext);
    return secretDict;
  } catch (err) {
    console.error("Secret value cannot be JSON parsed.")
    return null;
  }
}
// {
//   "Step" : "request.type",
//   "SecretId" : "string",
//   "ClientRequestToken" : "string"
// }

// lambda function
// lambda util
// test from lambda
