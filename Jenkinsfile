pipeline {
  agent {
    docker {
      image 'node:20'
      args '-u root:root'   // run as root so we can install awscli if needed
    }
  }

  environment {
    AWS_REGION     = 'us-east-1'           // <-- change
    S3_BUCKET      = 'project-golabing'  // <-- change
    BUILD_DIR      = 'dist'               // <-- change if your build outputs to 'dist'
    CLOUDFRONT_ID  = 'EZ8M10K3BEIHP'       // <-- change
    // ROUTE53_ZONE_ID = 'Z08434841EIHQSGBDO2G3'  // <-- optional
    // DOMAIN_NAME      = 'app.golabing.ai' // <-- optional
    AWS_CREDENTIALS_ID = 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6'       // Jenkins credential ID (create this)
  }

  options {
    ansiColor('xterm')
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Prepare') {
      steps {
        sh '''
          echo "node: $(node -v)  npm: $(npm -v || true)"
          if ! command -v aws >/dev/null 2>&1; then
            echo "installing awscli v2"
            curl -sS "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
            apt-get update -y && apt-get install -y unzip
            unzip -q /tmp/awscliv2.zip -d /tmp
            /tmp/aws/install --update
          fi
          aws --version
        '''
      }
    }

    stage('Install & Build') {
      steps {
        sh '''
          npm ci
          npm run build
        '''
      }
    }

    stage('Sync to S3') {
      steps {
        withAWS(credentials: "${AWS_CREDENTIALS_ID}", region: "${AWS_REGION}") {
          sh """
            echo "Syncing ${BUILD_DIR}/ -> s3://${S3_BUCKET}/"
            aws s3 sync ${BUILD_DIR}/ s3://${S3_BUCKET}/ --delete --acl public-read --exact-timestamps
          """
        }
      }
    }

    stage('CloudFront Invalidate') {
      steps {
        withAWS(credentials: "${AWS_CREDENTIALS_ID}", region: "${AWS_REGION}") {
          sh """
            echo "Invalidating CloudFront distribution ${CLOUDFRONT_ID}"
            aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*" \
              --query 'Invalidation.Id' --output text
          """
        }
      }
    }

    stage('Update Route53 (optional)') {
      when { expression { return env.ROUTE53_ZONE_ID && env.DOMAIN_NAME } }
      steps {
        withAWS(credentials: "${AWS_CREDENTIALS_ID}", region: "${AWS_REGION}") {
          script {
            def cfDomain = sh(script: "aws cloudfront get-distribution --id ${CLOUDFRONT_ID} --query 'Distribution.DomainName' --output text", returnStdout: true).trim()
            def cfHostedZoneId = "Z2FDTNDATAQYW2"
            def change = """
            {
              "Comment":"Update alias to CloudFront distribution",
              "Changes":[
                {
                  "Action":"UPSERT",
                  "ResourceRecordSet":{
                    "Name":"${env.DOMAIN_NAME}",
                    "Type":"A",
                    "AliasTarget":{
                      "HostedZoneId":"${cfHostedZoneId}",
                      "DNSName":"${cfDomain}",
                      "EvaluateTargetHealth":false
                    }
                  }
                }
              ]
            }
            """
            writeFile file: 'r53-change.json', text: change
            sh "aws route53 change-resource-record-sets --hosted-zone-id ${env.ROUTE53_ZONE_ID} --change-batch file://r53-change.json"
          }
        }
      }
    }
  }

  post {
    success { echo "✅ Deploy succeeded: https://${env.DOMAIN_NAME ?: env.S3_BUCKET}" }
    failure { echo "❌ Deploy failed — check logs" }
  }
}
