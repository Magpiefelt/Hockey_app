# Elite Sports DJ - Web Application

This is the official web application for **Elite Sports DJ**, a professional DJ service specializing in game day entertainment for sports events. This application serves as the main platform for clients to request quotes, manage bookings, and interact with the service.

---

## ✨ Features

- **Client-Facing Website:** A modern, responsive Nuxt.js frontend.
- **Quote Request System:** A comprehensive form for clients to request detailed quotes.
- **Admin Dashboard:** A secure area for administrators to manage quotes, bookings, clients, and content.
- **tRPC API:** A fully-typed, end-to-end API layer for robust communication between the frontend and backend.
- **Database Integration:** PostgreSQL database with a robust migration system.
- **Authentication:** Secure JWT-based authentication for users and administrators.
- **File Uploads:** Secure file uploads to Amazon S3 for client assets.
- **Payment Processing:** Integration with Stripe for handling payments and invoices.
- **Email Notifications:** SMTP-based email notifications for quotes, orders, and communication.
- **Production-Ready:** Containerized with Docker, ready for deployment on AWS with Infrastructure as Code (IaC).

## 🚀 Tech Stack

- **Frontend:** [Nuxt.js](https://nuxt.com/), [Vue.js](https://vuejs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Nitro](https://nitro.unjs.io/), [Node.js](https://nodejs.org/)
- **API:** [tRPC](https://trpc.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Caching:** [Redis](https://redis.io/)
- **Authentication:** [JWT](https://jwt.io/), [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **File Storage:** [Amazon S3](https://aws.amazon.com/s3/)
- **Payments:** [Stripe](https://stripe.com/)
- **Deployment:** [Docker](https://www.docker.com/), [AWS ECS](https://aws.amazon.com/ecs/), [CloudFormation](https://aws.amazon.com/cloudformation/), [Terraform](https://www.terraform.io/)
- **Testing:** [Vitest](https://vitest.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v8+)
- Docker and Docker Compose

### Local Development Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-repo/elite-sports-dj.git
    cd elite-sports-dj
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Copy the example environment file and fill in the required values for your local setup.

    ```bash
    cp .env.example .env
    ```

4.  **Start the development environment with Docker Compose:**

    This is the recommended way to run the application locally, as it includes the PostgreSQL database and Redis cache.

    ```bash
    docker-compose up --build
    ```

5.  **Run database migrations:**

    In a separate terminal, execute the database migration script.

    ```bash
    docker-compose exec app pnpm migrate up
    ```

6.  **Access the application:**

    The application will be available at `http://localhost:3000`.

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing.

- **Run all tests:**

  ```bash
  pnpm test
  ```

- **Run unit tests:**

  ```bash
  pnpm test:unit
  ```

- **Run integration tests:**

  ```bash
  pnpm test:integration
  ```

- **Generate a coverage report:**

  ```bash
  pnpm test:coverage
  ```

## ☁️ Production Deployment

For detailed instructions on deploying the application to a production environment on AWS, please refer to the [Enhanced Production Deployment Guide](./ENHANCED_DEPLOYMENT_GUIDE.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
