import express from "express";
import {CustomResponse} from "../utils/CustomResponse";
import {StatusCodes} from "../utils/StatusCodes";
import {UserServiceImpl} from "../services/impl/UserServiceImpl";

const userService = new UserServiceImpl();


export const login = (
    req:express.Request,
    res:express.Response,
    next:express.NextFunction
) => {

    userService.login(req, res)
        .then(response => {

            res.status(200).send(
                response
            )

        })
        .catch(error => {
            console.log(error)

            next(error)
        })
}




export const isconnected = (
    req:express.Request,
    res:express.Response,
    next:express.NextFunction
) => {

    userService.isconnected()
        .then(response => {

            res.status(200).send(
                new CustomResponse(
                    StatusCodes.SUCCESS,
                    "Connection status",
                    response,
                )
            )

        })
        .catch(error => {
            console.log(error)
            next(error)
        })

}





export const logout = (
    req:express.Request,
    res:express.Response,
    next:express.NextFunction
) => {


    userService.logout()
        .then(response => {
            res.status(200).send(
                    new CustomResponse(StatusCodes.SUCCESS,
                    "Logout successfully",
                    response
                )
            )
        })
        .catch(error => {
            next(error)
        })
}



