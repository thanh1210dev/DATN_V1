import axiosInstance from "../axiosInstance";

const UserApi = {
    search: (params) => axiosInstance.get("/user/search/client", { params }),
};

export default UserApi;