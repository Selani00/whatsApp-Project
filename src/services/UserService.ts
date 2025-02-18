import express from 'express';

export interface UserService{
    login(req: express.Request, res: express.Response) : Promise<any>
    isconnected() : Promise<any>
    logout() : Promise<any>
}