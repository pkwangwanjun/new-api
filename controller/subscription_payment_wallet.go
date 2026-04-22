package controller

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type SubscriptionWalletPayRequest struct {
	PlanId int `json:"plan_id"`
}

func SubscriptionRequestWalletPay(c *gin.Context) {
	userId := c.GetInt("id")
	lock := getTopUpLock(userId)
	if !lock.TryLock() {
		common.ApiErrorI18n(c, i18n.MsgUserTopUpProcessing)
		return
	}
	defer lock.Unlock()

	var req SubscriptionWalletPayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	result, err := model.PurchaseSubscriptionWithWallet(userId, req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}
