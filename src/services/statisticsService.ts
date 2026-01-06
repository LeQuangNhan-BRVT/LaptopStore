import apiClient from "./apiClient";

export const statisticsService = {
    getRevenue(type: string, year: number, month:number, week: number){
        return apiClient.get('/statistics/revenue', {params: {type, year, month, week}}).then(res => res.data)
    }
}


