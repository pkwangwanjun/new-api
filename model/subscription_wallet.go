package model

import (
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type WalletSubscriptionPurchaseResult struct {
	SubscriptionId int    `json:"subscription_id"`
	DeductedQuota  int    `json:"deducted_quota"`
	RemainingQuota int    `json:"remaining_quota"`
	TradeNo        string `json:"trade_no"`
}

func calculateSubscriptionWalletQuota(plan *SubscriptionPlan) (int, error) {
	if plan == nil || plan.Id == 0 {
		return 0, errors.New("invalid plan")
	}
	if plan.PriceAmount < 0.01 {
		return 0, errors.New("套餐金额过低")
	}
	dQuota := decimal.NewFromFloat(plan.PriceAmount).
		Mul(decimal.NewFromFloat(common.QuotaPerUnit)).
		Round(0)
	quota := int(dQuota.IntPart())
	if quota <= 0 {
		return 0, errors.New("套餐金额过低")
	}
	return quota, nil
}

func PurchaseSubscriptionWithWallet(userId int, planId int) (*WalletSubscriptionPurchaseResult, error) {
	if userId <= 0 {
		return nil, errors.New("invalid user id")
	}
	if planId <= 0 {
		return nil, errors.New("invalid plan id")
	}

	plan, err := GetSubscriptionPlanById(planId)
	if err != nil {
		return nil, err
	}
	if !plan.Enabled {
		return nil, errors.New("套餐未启用")
	}

	deductedQuota, err := calculateSubscriptionWalletQuota(plan)
	if err != nil {
		return nil, err
	}

	now := common.GetTimestamp()
	tradeNo := fmt.Sprintf("SUBWALLETUSR%dNO%s%d", userId, common.GetRandomString(6), now)
	result := &WalletSubscriptionPurchaseResult{
		DeductedQuota: deductedQuota,
		TradeNo:       tradeNo,
	}

	remainingQuota := 0
	upgradeGroup := ""
	logPlanTitle := ""

	err = DB.Transaction(func(tx *gorm.DB) error {
		var user User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Select("id", "quota").
			Where("id = ?", userId).
			First(&user).Error; err != nil {
			return err
		}

		if user.Quota < deductedQuota {
			return fmt.Errorf("钱包余额不足，当前余额 %s，所需 %s",
				logger.FormatQuota(user.Quota),
				logger.FormatQuota(deductedQuota))
		}

		if err := tx.Model(&User{}).
			Where("id = ?", userId).
			Update("quota", gorm.Expr("quota - ?", deductedQuota)).Error; err != nil {
			return err
		}

		order := &SubscriptionOrder{
			UserId:          userId,
			PlanId:          plan.Id,
			Money:           plan.PriceAmount,
			TradeNo:         tradeNo,
			PaymentMethod:   PaymentMethodWallet,
			Status:          common.TopUpStatusSuccess,
			CreateTime:      now,
			CompleteTime:    now,
			ProviderPayload: common.MapToJsonStr(map[string]interface{}{"source": PaymentMethodWallet}),
		}
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		sub, err := CreateUserSubscriptionFromPlanTx(tx, userId, plan, "order")
		if err != nil {
			return err
		}
		if err := upsertSubscriptionTopUpTx(tx, order); err != nil {
			return err
		}

		remainingQuota = user.Quota - deductedQuota
		result.SubscriptionId = sub.Id
		result.RemainingQuota = remainingQuota
		upgradeGroup = strings.TrimSpace(plan.UpgradeGroup)
		logPlanTitle = plan.Title
		return nil
	})
	if err != nil {
		return nil, err
	}

	_ = updateUserQuotaCache(userId, remainingQuota)
	if upgradeGroup != "" {
		_ = UpdateUserGroupCache(userId, upgradeGroup)
	}

	RecordLog(userId, LogTypeTopup, fmt.Sprintf("使用钱包余额购买订阅成功，套餐: %s，扣费: %s", logPlanTitle, logger.LogQuota(deductedQuota)))
	return result, nil
}
