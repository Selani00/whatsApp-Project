import fs from 'fs';
import path from 'path';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
// import qrcode from 'qrcode-terminal';
import qrcode from 'qrcode';
import {AppError} from "../utils/AppError";
import {StatusCodes} from "../utils/StatusCodes";
import dotenv from 'dotenv';
import rabbitMQInstance from '../rabbitmq/RabbitMQService';
import express from 'express';
// import {UserRepositoryImpl} from '../repository/Impl/UserRepositoryImpl';
// const userRepository = new UserRepositoryImpl();


dotenv.config();

const QUEUE_NAME: string = process.env.QUEUE_NAME || 'rabbitmq_queue';

interface MessagePayload {
    // id?: number | null;
    from: string;
    message: string;
    number?: string;
    timestamp: number;
}

class WhatsAppClientSingleton {
    private static instance: WhatsAppClientSingleton;
    private client: any;
    private retries: number = 0;
    private maxRetries: number = 3;
    private rabbitMQChannel: any;
    private qrCodeData: string | null = null;
    constructor() {
        if (WhatsAppClientSingleton.instance) {
            return WhatsAppClientSingleton.instance;
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'client-one',
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-software-rasterizer'
                ],
                defaultViewport: null,
                timeout: 60000,
                ignoreHTTPSErrors: true
            },
            restartOnAuthFail: true,
            qrMaxRetries: 5,
            authTimeoutMs: 60000,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 60000
        });

        this.retries = 0;
        this.maxRetries = 3;
        WhatsAppClientSingleton.instance = this;

        this.rabbitMQChannel = null;
        this.initializeRabbitMQ();
        this.registerEventListeners();
    }

    async initializeRabbitMQ() {
        try {
            const { channel } = await rabbitMQInstance.connect();
            this.rabbitMQChannel = channel;
            await this.rabbitMQChannel.assertQueue(QUEUE_NAME, { durable: false });
            console.log('RabbitMQ channel initialized and ready.');
        } catch (error: any) {
            console.error('Error initializing RabbitMQ channel:', error);
        }
    }

    registerEventListeners() {
        this.client.on('qr', (qr: string) => {
            try {
                this.qrCodeData = qr;
                console.log('QR code data:', qr);

                // when using qrcode-terminal
                // qrcode.generate(qr, { small: true });
            } catch (error: any) {
                console.error('Error generating QR code:', error.message);
            }
        });

        this.client.on('ready', () => {
            console.log('WhatsApp client is ready and connected!');
            this.retries = 0;
        });

        this.client.on('message', async (msg: any) => {
            try {
                const contact = await msg.getContact();
                const chat = await msg.getChat();

                console.log({
                    from: contact.pushname || contact.number,
                    number: msg.from,
                    message: msg.body,
                    timestamp: msg.timestamp,
                    chatName: chat.name

                });

                // if msg.from === status@broadcast then do not do anything so pass the message
                if (msg.from === 'status@broadcast') {
                    return;
                }

                if (this.rabbitMQChannel) {
                    const payload: MessagePayload = {
                        from: msg.from,
                        message: msg.body,
                        number: msg.number,
                        timestamp: msg.timestamp
                    };

                    await this.rabbitMQChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)));
                    console.log('Message sent to RabbitMQ queue:', msg.body);

                    await this.rabbitMQChannel.checkQueue(QUEUE_NAME);
                } else {
                    console.error('RabbitMQ channel is not initialized.');
                }
            } catch (err) {
                console.error('Error processing incoming message:', err);
            }
        });

        this.client.on('disconnected', async (reason: string) => {
            console.log('WhatsApp client was disconnected:', reason);
            this.retries = 0;
            await this.initialize();
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp client authenticated successfully!');
        });

        this.client.on('auth_failure', (msg: string) => {
            console.error('WhatsApp authentication failed:', msg);
        });
    }

    async initialize() {
        try {
            console.log('Initializing WhatsApp client...');
            await this.client.initialize();
        } catch (error: any) {
            console.error('Initialization error:', error);
            if (this.retries < this.maxRetries) {
                this.retries++;
                console.log(`Retrying initialization (${this.retries}/${this.maxRetries})...`);
                setTimeout(() => this.initialize(), 5000);
            } else {
                console.error('Max retries reached. Could not initialize WhatsApp client.');
                process.exit(1);
            }
        }
    }


    
    public getQRCodeImage = async (req: express.Request, res: express.Response) => {
        try {
            if (this.qrCodeData) {

                // qr code token

                // return res.status(200).send({
                //     qrCode: this.qrCodeData
                // });

                const qrImage = await qrcode.toDataURL(this.qrCodeData); // Generate QR as base64
                return res.status(200).send({ qrCode: qrImage });


                
            } else {
                throw new AppError('Failed to retrieve QR code', StatusCodes.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).send('Failed to generate QR code');
        }
    };

    

    async logout() {
        try {
            if (this.client) {
                await this.client.logout();
                console.log('WhatsApp client logged out successfully.');
                await this.client.destroy();               
                console.log('WhatsApp client destroyed.');
                // Delete session data
                const sessionPath = path.join(__dirname, '../../.wwebjs_auth');
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    console.log('Session data deleted.');
                }

                this.client= new Client({
                    authStrategy: new LocalAuth({
                        clientId: 'client-one',
                        dataPath: './.wwebjs_auth'
                    }),
                    puppeteer: {
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-accelerated-2d-canvas',
                            '--no-first-run',
                            '--no-zygote',
                            '--single-process',
                            '--disable-gpu',
                            '--disable-extensions',
                            '--disable-software-rasterizer'
                        ],
                        defaultViewport: null,
                        timeout: 60000,
                        ignoreHTTPSErrors: true
                    },
                    restartOnAuthFail: true,
                    qrMaxRetries: 5,
                    authTimeoutMs: 60000,
                    takeoverOnConflict: true,
                    takeoverTimeoutMs: 60000
                },
                
            );

            this.registerEventListeners();

                return 1;
            } else {
                console.log('No active client to log out.');
                return 0;
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
    
    async isConnected(): Promise<boolean> {
        try {
            console.log( "This is client information "+this.client.info);
            if (this.client.info === undefined || this.client.info === null) {
                console.log('Client is not connected.');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking connection status:', error);
            return false;
        }
    }
}



const whatsAppClientInstance = new WhatsAppClientSingleton();
export default whatsAppClientInstance;