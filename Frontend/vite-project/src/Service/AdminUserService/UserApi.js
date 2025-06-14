import axiosInstance from "../axiosInstance";



const UserApi = {

    search: (params) =>
      axiosInstance.get("/user/search/client", { params }),
    topPurchasers : (params) =>
        axiosInstance.get("/user/top-purchasers", { params }),
  
  };
  
  export default UserApi;
