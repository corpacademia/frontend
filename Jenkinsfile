pipeline {
    agent any

    tools {
        nodejs 'nodejs'  // This must match the name you configured in the Global Tool Configuration
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Install dependencies using npm
                    sh 'npm install'
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    // Build the React app (or Node.js project)
                    sh 'npm run build'
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    // Run tests using npm
                    sh 'npm test'
                }
            }
        }
    }
}
