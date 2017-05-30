#!/bin/bash

set -e

# Based on
# https://github.com/awslabs/serverless-application-model/tree/master/examples/2016-10-31/api_backend

# Package and deploy the template on S3
aws cloudformation package --template-file template.yaml \
  --s3-bucket aaron-alexa-skills \
  --s3-prefix math-quiz \
  --output-template-file template-packaged.yaml

aws cloudformation deploy --template-file template-packaged.yaml \
  --stack-name alexa-math-quiz \
  --capabilities CAPABILITY_IAM
