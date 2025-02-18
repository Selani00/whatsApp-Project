import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/DbConnection';


export interface UserAttributes {
    id: number;
    name:   string;
    number : string;
    service: string;
    selected_date   : string;
    selected_time   : string;
    status: string;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

const UserModel = sequelize.define<
    Model<UserAttributes, UserCreationAttributes>
>(
    'User',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            allowNull: false,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        service: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        selected_date: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        selected_time: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            allowNull: true,
        }
    },
    {
        tableName: 'user',
        timestamps: true,
    }
);

export default UserModel;
