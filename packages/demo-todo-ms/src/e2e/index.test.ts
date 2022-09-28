import { gql } from '@apollo/client';
import { appsyncClient } from '@miguelludert/node-client';
import exp = require('constants');
import { randomUUID } from 'crypto';
// import * as dotenv from 'dotenv';
// import { join } from 'path';

// dotenv.config({
//     path : join(__dirname, '../../dist/e2e.env')
// });

process.env = {
    ...process.env,
    MS_API_URL_OUTPUT_NAME : 'demo-graphql-url', 
    MS_API_KEY_SECRET_NAME : 'demo-api-key-secret-name'
};

describe("sample microservice", () => {
    describe("complete flow", () => { 
        // create a todotask with an image
        // query both together

        it("should create image, create todo, and query todo", async () => { 
            const expectedTodoId = randomUUID(); 
            const expectedImageId = randomUUID(); 
            const expectedImageUrl = "https://www.google.com"; 
            const expectedDescription = "hello world";
            const imageResult = await appsyncClient({
                query : `mutation MyMutation {
                    createImage(input: {
                        id: "${expectedImageId}",
                        url: "${expectedImageUrl}"
                    }) {
                      id
                    }
                }`
            });
            const imageId = imageResult.createImage.id;
            const todoResult = await appsyncClient({
                query : `mutation MyMutation {
                    createTodoTask(input: {
                        id: "${expectedTodoId}"
                        description: "${expectedDescription}", 
                        imageId: "${imageId}", status: New}){
                            id
                        }
                    }`
            });
            const toDoId = todoResult.createTodoTask.id;
            const { getTodoTask : todoQueryResult } = await appsyncClient({
                query : `query MyQuery {
                    getTodoTask(id: "${toDoId}") {
                        id
                        description
                        image {
                            id
                            url
                        }
                    }
                }`
            });
            expect(todoQueryResult.id).toBe(expectedTodoId);
            expect(todoQueryResult.description).toBe(expectedDescription);
            expect(todoQueryResult.image.id).toBe(expectedImageId);
            expect(todoQueryResult.image.url).toBe(expectedImageUrl);
        });
        it("should update ", async () => { 
            // create a todotask with an image
            // query both together
        });
        it("should shareTask twice (confirms Lambda functions)' ", async () => { 
            // create a todotask with an image
            // query both together
        });
        it("should list and delete", async () => { 
            // create a todotask with an image
            // query both together
        });
    });
});