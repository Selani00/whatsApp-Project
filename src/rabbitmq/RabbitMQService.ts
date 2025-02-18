import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

class RabbitMQ {
    private static instance: RabbitMQ;
    private connection: any;
    private channel: any;

    private constructor() {
        this.connection = null;
        this.channel = null;
    }

    public static getInstance(): RabbitMQ {
        if (!RabbitMQ.instance) {
            RabbitMQ.instance = new RabbitMQ();
        }
        return RabbitMQ.instance;
    }

    async connect() {
        if (!this.connection) {
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
        }
        return { connection: this.connection, channel: this.channel };
    }

    async close() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
        this.connection = null;
        this.channel = null;
    }
}

const rabbitMQInstance = RabbitMQ.getInstance();
export default rabbitMQInstance;
