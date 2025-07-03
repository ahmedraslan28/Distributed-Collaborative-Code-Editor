# Scalable Collaborative Code Editor
A collaborative, real-time code editor built with microservices architecture where users can seamlessly code together. It provides a platform for multiple users to enter a room, share a unique room ID, and collaborate on code simultaneously and chat with each other.

## Features

- Users can create and join rooms using a unique room ID.
- Code and chat with other users in the room 
- Used Redis Pub/Sub and RabbitMQ for fast, scalable inter-service communication.
- Supports multiple programming languages and execute the code in isolated docker container 

## Technologies Used

- **Java**
- **Spring Boot**
- **RabbitMq**
- **Redis**
- **Docker**
- **React**

## Setup Instructions
1. Docker should be installed on your machine:

2. Clone the repository:
   ```sh
   git clone https://github.com/ahmedraslan28/Scalable-Code-Collaborative-Editor.git
   cd Scalable-Code-Collaborative-Editor
   ```
3. Run commands:
   ```sh
   cd collaboration-service
   mvn clean install -DskipTests 
   cd ../execution-service
   mvn clean install -DskipTests
   docker-compose up --build -d 
   cd ../code-collab-client
   npm start
   ```
4. access the app on http://localhost:3000

