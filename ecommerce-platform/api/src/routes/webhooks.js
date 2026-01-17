const express = require('express');
const { body, validationResult } = require('express-validator');
const SendGridService = require('../services/sendGridService');
const TwilioService = require('../services/twilioService');
const MarketingService = require('../services/marketingService');
const router = express.Router();

const sendGridService = new SendGridService();
const twilioService = new TwilioService();
const marketingService = new MarketingService();

// Middleware to check validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// ==================== SENDGRID WEBHOOKS ====================

// SendGrid event webhook
router.post('/sendgrid', [
  body().isArray()
], handleValidationErrors, async (req, res) => {
  try {
    const events = req.body;
    
    // Process each event
    for (const event of events) {
      const processedEvent = await sendGridService.handleWebhook(event);
      
      if (processedEvent.success) {
        for (const eventData of processedEvent.events) {
          // Extract campaign and customer info from custom args
          const { campaign_id, customer_id } = eventData.customArgs || {};
          
          if (campaign_id) {
            // Track campaign interaction
            await marketingService.trackCampaignInteraction(
              campaign_id,
              customer_id,
              eventData.event.toUpperCase(),
              {
                messageId: eventData.messageId,
                ipAddress: eventData.ipAddress,
                userAgent: eventData.userAgent,
                clickUrl: eventData.clickUrl,
                revenue: eventData.customArgs?.revenue
              }
            );
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// ==================== TWILIO WEBHOOKS ====================

// Twilio SMS webhook
router.post('/twilio', async (req, res) => {
  try {
    const { type, campaign_id, customer_id, promo_code, cart_id, order_number } = req.query;
    
    // Process the SMS event
    const processedEvent = await twilioService.handleWebhook(req.body);
    
    if (processedEvent.success) {
      for (const eventData of processedEvent.events) {
        // Track campaign interaction if it's related to a campaign
        if (campaign_id) {
          await marketingService.trackCampaignInteraction(
            campaign_id,
            customer_id,
            eventData.messageStatus.toUpperCase(),
            {
              messageId: eventData.messageSid,
              errorCode: eventData.errorCode,
              errorMessage: eventData.errorMessage,
              deliveryTimestamp: eventData.deliveryTimestamp,
              readTimestamp: eventData.readTimestamp
            }
          );
        }

        // Handle specific webhook types
        switch (type) {
          case 'cart_recovery':
            await handleCartRecoveryWebhook(eventData, cart_id);
            break;
          case 'promotion':
            await handlePromotionWebhook(eventData, promo_code);
            break;
          case 'order_update':
            await handleOrderUpdateWebhook(eventData, order_number);
            break;
        }
      }
    }

    // Respond with TwiML for incoming messages
    if (req.body.MessageStatus === 'received') {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Thank you for your message. We'll get back to you soon!</Message>
        </Response>`;
      res.type('text/xml').send(twiml);
    } else {
      res.status(200).send('OK');
    }
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// ==================== CMS WEBHOOKS ====================

// CMS content webhook
router.post('/cms', [
  body('type').isIn(['content_created', 'content_updated', 'content_deleted']),
  body('contentType').isIn(['blog', 'page', 'product']),
  body('contentId').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { type, contentType, contentId, content } = req.body;
    
    // Handle CMS content changes
    switch (type) {
      case 'content_created':
      case 'content_updated':
        await handleCmsContentUpdate(contentType, contentId, content);
        break;
      case 'content_deleted':
        await handleCmsContentDelete(contentType, contentId);
        break;
    }

    res.json({
      success: true,
      message: 'CMS webhook processed successfully'
    });
  } catch (error) {
    console.error('CMS webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing CMS webhook'
    });
  }
});

// ==================== PAYMENT WEBHOOKS ====================

// Stripe webhook for payment events
router.post('/stripe', async (req, res) => {
  try {
    const event = req.body;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// ==================== HELPER FUNCTIONS ====================

async function handleCartRecoveryWebhook(eventData, cartId) {
  try {
    if (eventData.messageStatus === 'delivered') {
      // Mark SMS as sent for abandoned cart
      await marketingService.prisma.abandonedCart.update({
        where: { id: cartId },
        data: { recoverySmsSent: true }
      });
    }
  } catch (error) {
    console.error('Error handling cart recovery webhook:', error);
  }
}

async function handlePromotionWebhook(eventData, promoCode) {
  try {
    if (eventData.messageStatus === 'delivered') {
      // Track promotion SMS delivery
      console.log(`Promotion SMS delivered for code: ${promoCode}`);
    }
  } catch (error) {
    console.error('Error handling promotion webhook:', error);
  }
}

async function handleOrderUpdateWebhook(eventData, orderNumber) {
  try {
    if (eventData.messageStatus === 'delivered') {
      // Track order update SMS delivery
      console.log(`Order update SMS delivered for order: ${orderNumber}`);
    }
  } catch (error) {
    console.error('Error handling order update webhook:', error);
  }
}

async function handleCmsContentUpdate(contentType, contentId, content) {
  try {
    // Create a job to sync CMS content
    await marketingService.prisma.marketingJob.create({
      data: {
        type: 'SYNC_CMS_CONTENT',
        status: 'PENDING',
        priority: 'NORMAL',
        data: {
          contentType,
          contentId,
          content,
          action: 'update'
        }
      }
    });
  } catch (error) {
    console.error('Error handling CMS content update:', error);
  }
}

async function handleCmsContentDelete(contentType, contentId) {
  try {
    // Create a job to handle CMS content deletion
    await marketingService.prisma.marketingJob.create({
      data: {
        type: 'SYNC_CMS_CONTENT',
        status: 'PENDING',
        priority: 'NORMAL',
        data: {
          contentType,
          contentId,
          action: 'delete'
        }
      }
    });
  } catch (error) {
    console.error('Error handling CMS content delete:', error);
  }
}

async function handlePaymentSuccess(paymentIntent) {
  try {
    // Track successful payment for analytics
    if (paymentIntent.metadata.campaign_id) {
      await marketingService.trackCampaignInteraction(
        paymentIntent.metadata.campaign_id,
        paymentIntent.metadata.customer_id,
        'CONVERTED',
        {
          revenue: paymentIntent.amount / 100, // Convert from cents
          paymentIntentId: paymentIntent.id
        }
      );
    }

    // Update abandoned cart if this was a recovery
    if (paymentIntent.metadata.cart_id) {
      await marketingService.prisma.abandonedCart.update({
        where: { id: paymentIntent.metadata.cart_id },
        data: { recoveredAt: new Date() }
      });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    // Track failed payment for analytics
    console.log(`Payment failed for payment intent: ${paymentIntent.id}`);
    
    // Could trigger recovery campaign here
    if (paymentIntent.metadata.customer_id) {
      await marketingService.prisma.marketingJob.create({
        data: {
          type: 'SEND_PAYMENT_RECOVERY',
          status: 'PENDING',
          priority: 'HIGH',
          data: {
            customerId: paymentIntent.metadata.customer_id,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionPayment(invoice) {
  try {
    // Track subscription payment for analytics
    console.log(`Subscription payment received: ${invoice.id}`);
    
    // Could trigger subscription renewal campaign
    if (invoice.customer) {
      await marketingService.prisma.marketingJob.create({
        data: {
          type: 'SEND_SUBSCRIPTION_RENEWAL_CONFIRMATION',
          status: 'PENDING',
          priority: 'NORMAL',
          data: {
            customerId: invoice.customer,
            invoiceId: invoice.id,
            amount: invoice.amount_paid / 100
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription payment:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    // Track new subscription
    console.log(`New subscription created: ${subscription.id}`);
    
    // Send welcome email/SMS
    if (subscription.customer) {
      await marketingService.prisma.marketingJob.create({
        data: {
          type: 'SEND_SUBSCRIPTION_WELCOME',
          status: 'PENDING',
          priority: 'HIGH',
          data: {
            customerId: subscription.customer,
            subscriptionId: subscription.id
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    // Track subscription cancellation
    console.log(`Subscription cancelled: ${subscription.id}`);
    
    // Send cancellation confirmation
    if (subscription.customer) {
      await marketingService.prisma.marketingJob.create({
        data: {
          type: 'SEND_SUBSCRIPTION_CANCELLATION',
          status: 'PENDING',
          priority: 'NORMAL',
          data: {
            customerId: subscription.customer,
            subscriptionId: subscription.id
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

module.exports = router;
