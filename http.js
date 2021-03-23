import axios from "axios";
import {
    Loading,
    Message,
    MessageBox
} from "element-ui";
let loadding;
import router from '../router';
import '../assets/common/global';
import {
    resetToken
} from './modules/permission';

function startLoading() {
    loadding = Loading.service({
        lock: true,
        text: '拼命加载中...',
        background: 'rgba(255,255,255,1)'
    });
}

function endLoading() {
    apiCount--;
    if (apiCount <= 0) {
        loadding.close();
    }
}
let apiCount = 0;

//请求拦截 
//处理登录状态过期，跳转登录页面
axios.interceptors.request.use(config => {
    //加载动画
    startLoading();
    apiCount++;
    return config;
}, err => {
    return Promise.reject(err);
})

//响应拦截
axios.interceptors.response.use(response => {
    //结束加载动画
    setTimeout(endLoading, 300);
    if (!response.data.statusCode) {
        //在这里调一下获取token接口，
        return response;
    } else if (response.data.statusCode === '811007') { //登录过期，重新登录
        MessageBox.confirm('对不起，您的登录状态已过期，请重新登陆', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            if (router.currentRoute.path != '/login') { //这里必须限制为非login页面
                router.replace({
                    path: '/login',
                    query: {
                        redirect: router.currentRoute.fullPath
                    }
                })
                return false;
            }
        })
    } else if (response.data.statusCode === '811006') {
        resetToken();
        return axios(response.config);
    } else if (response.data.statusCode !== '000000' && response.config.url.indexOf('/manage/contract/role/detail') > -1) {
        Message.error({
            message: response.data.statusMsg,
            duration: 5000
        });
        return response;
    } else if (response.data.statusCode !== '000000') {
        Message.error({
            message: response.data.statusMsg,
            duration: 5000
        });
        //return response;
    } else {
        return response;
    }
}, err => {
    //错误提醒
    endLoading();
    if (err && err.response) {
        switch (err.response.status) {
            case 400:
                err.message = '错误请求'
                break
            case 401:
                err.message = '未授权，请重新登录'
                break
            case 403:
                err.message = '拒绝访问'
                break
            case 404:
                err.message = '请求错误,未找到该资源'
                break
            case 405:
                err.message = '请求方法未允许'
                break
            case 408:
                err.message = '请求超时'
                break
            case 500:
                err.message = '服务器端出错'
                break
            case 501:
                err.message = '网络未实现'
                break
            case 502:
                err.message = '网络错误'
                break
            case 503:
                err.message = '服务不可用'
                break
            case 504:
                err.message = '网络超时'
                break
            case 505:
                err.message = 'http版本不支持该请求'
                break
            default:
                err.message = `连接错误${err.response.status}`
        }
    }
    Message.error(err.message);
    return Promise.reject(err);
})

export default {
    post(url, param, timeout) {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: global.SERVER_NAME + url,
                data: param,
                withCredentials: true,
                timeout: timeout ? timeout : 10000,
            }).then(res => {
                if (res.data) {
                    resolve(res.data);
                }
            })
        })
    },
    formDataPost(url, param) {
        return new Promise((resolve, reject) => {
            let formData = new FormData();
            for (let it in param) {
                formData.append(it, param[it]);
            }
            axios({
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                url: global.SERVER_NAME + url,
                data: formData,
                timeout: 10000,
                withCredentials: true,
            }).then(res => {
                if (res.data) {
                    resolve(res.data);
                }
            })
        })
    },
    formPost(url, param) {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                url: global.SERVER_NAME + url,
                data: param,
                timeout: 10000,
                withCredentials: true,
            }).then(res => {
                if (res.data) {
                    resolve(res.data);
                }
            })
        })
    },
    get(url, param) {
        return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: global.SERVER_NAME + url,
                data: {},
                params: param,
                timeout: 10000,
                withCredentials: true,
                headers: {
                    "content-type": "application/json;charset=utf-8"
                },
            }).then(res => {
                resolve(res.data);
            })
        })
    },
    download(url, params) {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: global.SERVER_NAME + url,
                data: {},
                params: params,
                responseType: 'arraybuffer',
                withCredentials: true,
            }).then(res => {
                resolve(res.data);
            })
        })
    },
    downloadPost(url, params) {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: global.SERVER_NAME + url,
                data: params,
                responseType: 'arraybuffer',
                withCredentials: true,
            }).then(res => {
                resolve(res.data);
            })
        })
    }
};