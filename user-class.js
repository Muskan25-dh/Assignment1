class Users {
    constructor( id,username,email,pwd,avatar,valid){
        this.id=id;
        this.username=username;
        this.email=email;
        this.pwd=pwd;
        this.avatar=avatar;
        this.valid=valid
    }
}

module.exports = Users;