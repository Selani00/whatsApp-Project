import express from 'express'
import * as process from "process";
import cors from 'cors'
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import sequelize from './db/DbConnection';
import {AppError} from "./utils/AppError";
import {StatusCodes} from "./utils/StatusCodes";
import {CustomResponse} from "./utils/CustomResponse";

import UserRoutes from "./routes/UserRoutes";
import {UserServiceImpl} from "./services/impl/UserServiceImpl";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5800;

app.use(
    cors({
      origin: '*',
      credentials: true,
    })
)

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/user', UserRoutes)


app.get('/health',
    (
        req:express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        res.status(200).send(
            new CustomResponse(
                StatusCodes.SUCCESS,
                'Back auth service server is running 🎉',
            )
        )
    }
)

sequelize.sync({alter:false})
    .then(async () => {
        console.log('RabbitMq Database synchronized');

    })
    .catch((error) => {
        console.error('Failed to synchronize auth database:', error)
    });

    const startServer  = async () => {
        try{
            app.listen(PORT, () => {
                console.log(`Server is running at http://localhost:${PORT}`);
            });
    
    
    
            // const { isConnected } = await userService.isconnected();
            // if(isConnected === true){
            //         await startRabbitMQConsumer();
            // }
            
        }catch (error){
            throw new AppError('Unable to start the server', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
    
    startServer()