import express from "express";

import * as UserControllers from "../controllers/UserControllers";


let router = express.Router();

router.get('/is-conneted',  UserControllers.isconnected)

router.get('/login',  UserControllers.login)

router.get('/logout',UserControllers.logout)

export default router;