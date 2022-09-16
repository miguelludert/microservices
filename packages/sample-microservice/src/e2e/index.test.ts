import { gql } from '@apollo/client';
import { appsyncClient } from '@miguelludert/gql-client';
// import * as dotenv from 'dotenv';
// import { join } from 'path';

// dotenv.config({
//     path : join(__dirname, '../../dist/e2e.env')
// });

process.env = {
    ...process.env,
    MS_API_URL_OUTPUT_NAME : 'demographql-url', 
    MS_API_KEY_SECRET_NAME : ''
};

describe("sample microservice", async () => {
    describe("complete flow", async () => { 
        // create a todotask with an image
        // query both together

        it("should create image and todo (confirms create)", async () => { 
            const imageResult = await appsyncClient({
                query : `mutation MyMutation {
                    createImage(input: {url: "https://www.google.com"}) {
                      id
                    }
                `
            });
            const imageId = imageResult.createImage.id;
            const todoResult = await appsyncClient({
                query : `mutation MyMutation {
                    createTodoTask(input: {description: "hello world", imageId: "${imageId}", status: New})
                  }
                `
            });
            const toDoId = todoResult.createTodoTask.id;
            const todoQueryResult = await appsyncClient({
                query : `query MyQuery {
                    getTodoTask(id: "${toDoId}") {
                      id
                      status
                      image {
                        id
                        url
                      }
                      description
                    }
                  }
                `
            });
            console.info(todoQueryResult);
        });
        it("should query (confirms query)", async () => { 
            // create a todotask with an image
            // query both together
        });
        it("should update (confirms update", async () => { 
            // create a todotask with an image
            // query both together
        });
        it("should shareTask twice (confirms Lambda functions)' ", async () => { 
            // create a todotask with an image
            // query both together
        });
        it("should list (confirms lists)' ", async () => { 
            // create a todotask with an image
            // query both together
        });
        it("should cleanup (confirms delete)' ", async () => { 
            // create a todotask with an image
            // query both together
        });
    });
});