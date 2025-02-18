export class AppError extends Error{
    public statusCode: number;
    public customStatusCode?: number;
    public status: string;
    public isOperational: boolean;

    constructor(message:string, statusCode:number, customStatusCode?:number) {
        super(message);

        this.statusCode= statusCode;
        this.customStatusCode= customStatusCode;
        this.status = statusCode>=400 && statusCode<500 ? 'fail' : 'error';
        this.isOperational = true
    }

}