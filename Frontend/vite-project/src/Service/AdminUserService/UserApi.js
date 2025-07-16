import axiosInstance from "../axiosInstance";

const UserApi = {
    search: (params) => {
        const filteredParams = {
            code: params.code || undefined,
            name: params.name || undefined,
            phoneNumber: params.phoneNumber || undefined,
            email: params.email || undefined,
            minLoyaltyPoints: params.minLoyaltyPoints || undefined,
            maxLoyaltyPoints: params.maxLoyaltyPoints || undefined,
            birthDate: params.birthDate || undefined,
            startDate: params.startDate ? new Date(params.startDate).toISOString() : undefined,
            endDate: params.endDate ? new Date(params.endDate).toISOString() : undefined,
            page: params.page,
            size: params.size
        };
        return axiosInstance.get("/user/search/client", { params: filteredParams });
    },
};

export default UserApi;