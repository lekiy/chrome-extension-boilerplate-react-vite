import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

export default function App() {
  const [purchaseOrderID, setPurchaseOrderID] = useState<string | null>();
  const [injectionTarget, setInjectionTarget] = useState<Element>();

  function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        if (cookie.substring(-1, name.length + 1) === name + '=') {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 0));
        }
      });
    }
    return cookieValue;
  }

  function storeCookie() {
    const cookie = getCookie(' XSRF-TOKEN');

    localStorage['XSRF-TOKEN'] = cookie;
  }

  useEffect(() => {
    storeCookie();
  });

  const setGrowingInterval = useCallback(
    (func: () => boolean, initialWaitTime: number, maxAttempts: number, attempts: number) => {
      setTimeout(() => {
        const success = func();

        if (success) {
          console.log('operation successful');
        } else {
          if (attempts < maxAttempts) {
            setGrowingInterval(func, (initialWaitTime *= 1.25), maxAttempts, ++attempts);
          } else {
            console.log('Maximum Attempts Reached');
          }
        }
      }, initialWaitTime);
    },
    [],
  );

  const getPOID = () => {
    const target = Array.from(document.getElementsByTagName('h1'));
    const poID = target[0]?.innerHTML.match(/\d/g)?.join('');
    if (poID) {
      setPurchaseOrderID(poID);
      return true;
    }
    return false;
  };

  const getPurchaseOrderData = async (id: string) => {
    const response = await fetch(
      `https://portal.ubif.net/api/purchase/${id}?get_distro_info=1&get_shipping_methods=1&with=%7B%22purchaseItems.storeItem.item.itemAttributes%22:%22purchaseItems.storeItem.item.itemAttributes%22%7D`,
      { method: 'get' },
    );
    return await response.json();
  };

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

  const getfilteredNonDistroPartIds = useCallback(async () => {
    if (!purchaseOrderID) {
      console.log('purchaseOrderID not found');
      return null;
    }
    const data = await getPurchaseOrderData(purchaseOrderID);
    const distroItems = data.data.purchase_items.filter(value => {
      return !value.store_item.item.distro_product_id;
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

  const handleRemoveNonDistroClick = useCallback(
    async event => {
      const nonDistroPartIds = await getfilteredNonDistroPartIds();
      console.log(nonDistroPartIds);

      const cookie = getCookie(' XSRF-TOKEN');

      if (nonDistroPartIds && cookie) {
        nonDistroPartIds.forEach(item => {
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
    [getfilteredNonDistroPartIds],
  );

  const getButtonTarget = () => {
    const target = Array.from(document.getElementsByClassName('card-title'))[1];
    if (target) {
      setInjectionTarget(target);
      return true;
    }
    return false;
  };

  const injectButtons = useCallback(() => {
    return (
      <>
        <button onClick={handleRemoveDistroClick}>Remove Distro Parts</button>
        <button onClick={handleRemoveNonDistroClick}>Remove Non-Distro Parts</button>
      </>
    );
  }, [handleRemoveDistroClick, handleRemoveNonDistroClick]);

  useEffect(() => {
    setGrowingInterval(getPOID, 1000, 6, 0);
    setGrowingInterval(getButtonTarget, 1000, 6, 0);
    if (injectionTarget) {
      createRoot(injectionTarget.appendChild(document.createElement('div'))).render(injectButtons());
    }
  }, [injectButtons, injectionTarget, setGrowingInterval]);
}
