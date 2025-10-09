export class User {
    id: number;
    username:string;
    email:string;
    pwd:string;
    avatar?: string;
    valid?:boolean;
    constructor(id:number=0, username:string="", email:string="", pwd:string, avatar:string=""){

        this.id = id;
        this.username= username;
        this.email=email;
        this.pwd =pwd;
        this.avatar= avatar;
    }
}
