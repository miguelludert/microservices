import axios, { AxiosRequestConfig, Method } from 'axios';
//import { ApolloClient, InMemoryCache } from '@apollo/client';
import { Fn } from 'aws-cdk-lib';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { CloudFormationClient, ListExportsCommand } from "@aws-sdk/client-cloudformation"; // ES Modules import

export interface AppsyncClientProps {
  appName?: string;
  query: string;
  variables?: any;
  operationName?: string;
}

export async function getSecrets() { 
    const { MS_API_URL_OUTPUT_NAME, MS_API_KEY_SECRET_NAME, AWS_REGION } = process.env;
    const config = {
      region : AWS_REGION
    };
    const secretClient = new SecretsManagerClient(config);
    const cfnClient = new CloudFormationClient(config);
    const apiKeyPromise = secretClient.send(new GetSecretValueCommand({
        SecretId : MS_API_KEY_SECRET_NAME
    }));
    const apiUrlPromise = cfnClient.send(new ListExportsCommand({}));
    return {
        apiKey : (await apiKeyPromise).SecretString,
        apiUrl : (await apiUrlPromise).Exports.filter(f => f.Name == MS_API_URL_OUTPUT_NAME).map(m => m.Value).pop(),
    };
}

export async function appsyncClient<TResult = any>(props: AppsyncClientProps) {
  const { query, variables, operationName, appName } = props;
  const { PREFIX, STAGE, APP_NAME, AWS_REGION } = process.env;
  const { apiKey, apiUrl } = await getSecrets();
  const body = JSON.stringify({ query, variables, operationName });
  try {
    const axiosRequest : AxiosRequestConfig<any> = {
      url: apiUrl,
      method : 'POST' ,
      headers: {
        'Content-Type' : 'application/json',
        'x-api-key' : apiKey
      },
      data: body,
    };
    const result = await axios(axiosRequest);
    // is it result.data.errors or result.data.data.errors?
    const errors = result.data?.errors;
    if(errors && errors.length > 0) {
      console.error('appsyncClient - graphql errors: ', JSON.stringify(errors, null, 2));
      throw new Error('error, see console');
    }
    return result.data.data as TResult;
  } catch (err) {
    const errors = err.response?.data?.errors;
    if(errors) {
      console.error('appsyncClient - 1 application errors: ', JSON.stringify(errors, null, 2));
    } else {7
      console.info('appsyncClient - 2 application error: ',err);
    }
    throw err;
  }
}



    // const cache = new InMemoryCache();
    // const client = new ApolloClient({
    //   cache: cache,
    //   uri: process.env.GRAPHQL_URL,
    //   queryDeduplication : false,
    //   version: '1.3',
    //   defaultOptions: {
    //     watchQuery: {
    //       fetchPolicy: 'cache-and-network',
    //     },
    //   },
    // });

// {
//     protocol: 'https:',
//     host: 'miguel.thrivingartist.net',
//     port: 443,
//     hostname: 'miguel.thrivingartist.net',
//     pathname: '/graphql',
//     path: '/graphql',
//     href: 'https://miguel.thrivingartist.net/graphql',
//     body: '{"query":"mutation {\\ncreateMedia_0 : createMedia(input: {\\n            status: PENDING,  \\n            parentType: \\"Artwork\\", \\n            parentId: \\"6b297986-0b65-403f-855a-f43525d79679\\", \\n            owner: \\"a01682ad-2162-4a2f-996d-328412759123\\", \\n            order: 1640634956442, \\n            name: \\"cognito_config.png\\",\\n            mimeType: \\"image/png\\",\\n            fileSize: 40098\\n        }) {\\n            id\\n        }\\n}"}',
//     headers: {
//       Host: 'miguel.thrivingartist.net:443',
//       'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
//       'Content-Length': 450,
//       'X-Amz-Security-Token': 'IQoJb3JpZ2luX2VjELT//////////wEaCXVzLWVhc3QtMSJIMEYCIQCEkOZa4UD0rOg96i56CPD+w3F/CApr7FUOd2IEtm9hcQIhAJo4n3II40M/DlGIANGDN3P/l4agNtMM0fx0MKRefp7CKrACCK3//////////wEQABoMNjY2NjEyMDg2NjU2Igxkv97a40Em/L+JVvEqhAInU9qZJZ9V6SDfxPeZYi4v3KDDd5SL5NIlEGrGvpWnGKGH1tqHLgtlaBl6WUSXSXEx8zYQwzEqY4Xypn7PSPAB8ySppcyxFGjXSSGuQxUzT6+C/63obcFrxA1Wdrh4JFrLrYS19+u8AMRooGQXfRuds4Y4PU1/Jfqvi6Lqe07GkfGS4smT4AJY9VO64HQW9uWsIDfSrFQ88zwKrEG5z/HxkkIMBoPLHZ97OD6df9umOiF/MqLOzkfzGUwJq4B/oJT048PcWpaSyLeDjhJAmmglN3wg/LiWpxtVU5pxtj7PjrMVGpzifisu6ZIimDXOh/sHBc77Yv9n0mvmqWMkI77aSC0nFzDLtKiOBjqZAZx2xY3+HlYxuivg69ohgMcEWWUy57plNGlIAHdNb00Cme3K4uo3WmNebf1eFyuCVQhx+l5/3vn2YbbYTk3uoKUhAwlBpaXpDUW6fvGg/IWBUwbEWZMvV/IGT0OxZXo7PqkZ9qpC6YIWcGM6ZGsPwGTAn/fZu2Igjl0qH2RyNnBDQGItKY4PN0ovXM2axfXwseHcmHJlkndV1A==',
//       'X-Amz-Date': '20211227T195556Z',
//       Authorization: 'AWS4-HMAC-SHA256 Credential=ASIAZWNJNG6ACHSW3J4B/20211227/us-east-1//aws4_request, SignedHeaders=content-length;content-type;host;x-amz-date;x-amz-security-token, Signature=e5d5f31b650777d5d715e17fe5c894cc414c99669f8248ab78489ab447b720f3'
//     },
//     method: 'POST'
//   }




// import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// let configuration = {} as GqlCompleteClientConfig<>;

// export interface GqlClientConfig<TCacheShape extends ApolloCache> {
//     url : string;
//     cache : TCacheShape
// }

// export interface GqlCompleteClientConfig<TCacheShape> extends GqlClientConfig<TCacheShape>
// {
//     client : ApolloClient<TCacheShape>;
// }

// export interface GqlRequest {
//     query : string;
//     variables : Record<string,any>;
//     microservice : string;
// }

// export interface GqlResponse {
//     query : string;
//     variables : Record<string,any>;
//     microservice : string;
// }

// export const configure = (config? : GqlClientConfig<TCacheShape>) => { 

// }

// export const client  = (request : GqlRequest) => {
//     // validate configuration exists
//     // connect to microservice by name
//     const client = new ApolloClient({
//         uri: configuration.url,
//         cache: new InMemoryCache(),
//     });
//     return client;
// }


// export {
//     gql
// };