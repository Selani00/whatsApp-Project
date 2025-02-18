import {AppError} from "../../utils/AppError";
import {StatusCodes} from "../../utils/StatusCodes";
import process from "process";
import express from 'express';
import { UserService } from "../UserService";
import whatsAppClientInstance from "../../whatsApp/WhatsAppClient";
// import {startRabbitMQConsumer} from "../SMSService"

export class UserServiceImpl implements UserService{
    constructor(){}

    public login = async (req: express.Request, res: express.Response) => {
        await whatsAppClientInstance.initialize();
        if (whatsAppClientInstance.getQRCodeImage) {
            await whatsAppClientInstance.getQRCodeImage(req, res);

        } else {
            throw new AppError('Failed to retrieve QR code', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    };
    
    
    public isconnected = async () => {
        let isConnected = await whatsAppClientInstance.isConnected();
        if (isConnected===null){
            isConnected = false;
        }
        return { isConnected };
    };

    public logout = async () => {
        try {
           return await whatsAppClientInstance.logout();
            
        }
        catch (error){
            console.error('Error logging out:', error);
            throw new AppError('Failed to logout', StatusCodes.INTERNAL_SERVER_ERROR);
        }

        // await whatsAppClientInstance.logout();
           

    };
}