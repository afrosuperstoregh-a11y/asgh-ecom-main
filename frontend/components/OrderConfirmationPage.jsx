import Header from './order-confirmation/Header';
import OrderSuccessBanner from './order-confirmation/OrderSuccessBanner';
import OrderSummary from './order-confirmation/OrderSummary';
import DeliveryDetails from './order-confirmation/DeliveryDetails';
import PaymentDetails from './order-confirmation/PaymentDetails';
import OrderStatusTimeline from './order-confirmation/OrderStatusTimeline';
import OrderActions from './order-confirmation/OrderActions';
import SupportSection from './order-confirmation/SupportSection';
import Footer from './order-confirmation/Footer';

const OrderConfirmationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrderSuccessBanner />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <OrderSummary />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DeliveryDetails />
              <PaymentDetails />
            </div>
            <OrderStatusTimeline />
            <OrderActions />
          </div>
          <div className="space-y-8">
            <SupportSection />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
