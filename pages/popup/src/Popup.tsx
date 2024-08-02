import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@chrome-extension-boilerplate/shared';
import { useCallback, useState } from 'react';

const Popup = () => {
  const [purchaseOrderID, setPurchaseOrderID] = useState<string | null>();

  const getPOID = () => {
    const target = Array.from(document.getElementsByTagName('h1'));
    const poID = target[0]?.innerHTML.match(/\d/g)?.join('');
    if (poID) {
      setPurchaseOrderID(poID);
      return true;
    }
    console.log('could not find PO ID');
    return false;
  };

  const getPurchaseOrderData = async (id: string) => {
    const response = await fetch(
      `https://portal.ubif.net/api/purchase/${id}?get_distro_info=1&get_shipping_methods=1&with=%7B%22purchaseItems.storeItem.item.itemAttributes%22:%22purchaseItems.storeItem.item.itemAttributes%22%7D`,
      { method: 'get' },
    );
    return await response.json();
  };

  function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        if (cookie.substring(0, name.length + 1) === name + '=') {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        }
      });
    }
    console.log(cookieValue);
    return cookieValue;
  }

  const getfilteredDistroPartIds = useCallback(async () => {
    if (!purchaseOrderID) {
      console.log('purchaseOrderID not found');
      return null;
    }
    const data = await getPurchaseOrderData(purchaseOrderID);
    const distroItems = data.data.purchase_items.filter(value => {
      return value.store_item.item.distro_product_id;
    });
    const distroItemIds = distroItems.map(item => {
      return item.id;
    });
    return distroItemIds;
  }, [purchaseOrderID]);

  const handleRemoveDistroClick = useCallback(
    async event => {
      const distroPartIds = await getfilteredDistroPartIds();
      console.log(distroPartIds);

      const cookie = getCookie(' XSRF-TOKEN');

      if (distroPartIds && cookie) {
        distroPartIds.forEach(item => {
          fetch(`https://portal.ubif.net/api/purchaseitem/${item}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'X-Xsrf-Token': cookie,
            },
          });
        });
        location.reload();
      } else {
        console.log('No distro Parts found');
      }
    },
    [getfilteredDistroPartIds],
  );

  return (
    <div>
      <button onClick={() => console.log(localStorage['XSRF-TOKEN'])}>Remove Non-Distro Parts</button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
