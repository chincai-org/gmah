# gmah

Setup: `npm install`
Dev: `npm run dev`
Start local dynamo: `docker run -p 8000:8000 amazon/dynamodb-local`
Setup local dynamo table: `node .\scripts\localTableManager.js` (It currently will create a table named "user")
Deplot instructions: Zip everything except node_modules and .env and upload to [AWS beanstalk](https://ap-southeast-5.console.aws.amazon.com/elasticbeanstalk/home?region=ap-southeast-5#/environment/dashboard?environmentId=e-tyhth82n3m)