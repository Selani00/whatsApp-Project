export class CustomResponse {

    private _status :number;
    private _message :string;
    private _data? :any;
    private _totalPages? :number;

    constructor(status :number, message :string, data?:any, totalPages?:number) {
        this._status=status;
        this._message=message;
        this._data=data;
        this._totalPages=totalPages;
    }


    get status(): number {
        return this._status;
    }

    set status(value: number) {
        this._status = value;
    }

    get message(): string {
        return this._message;
    }

    set message(value: string) {
        this._message = value;
    }

    get totalPages(): number {
        return<number> this._totalPages;
    }

    set totalPages(value: number) {
        this._totalPages = value;
    }

    get data(): any {
        return this._data;
    }

    set data(value: any) {
        this._data = value;
    }

    toJSON(){
        return{
            status:this.status,
            message:this.message,
            data:this.data,
            totalPages:this.totalPages
        }
    }
}