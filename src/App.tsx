import { useAccount, useConnect, useDisconnect, useReadContracts, useWriteContract } from 'wagmi'
import { Address, erc20Abi, formatUnits, maxUint256, parseUnits, zeroAddress } from 'viem'
import { stataUSDCAbi } from './abi/stataUSDC'
import React, { Fragment, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { base } from 'viem/chains'
function App() {
  const queryClient = useQueryClient();
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { data: hash, error: txError, isPending, writeContract } = useWriteContract()
  const [ txHashArray, setTxHashArray] = useState(Array<`0x${string}` | undefined>)
  const { disconnect } = useDisconnect()
  const USDCContract = {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    abi: erc20Abi
  } as const;
  const aUSDCContract = {
    address: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    abi: erc20Abi
  } as const;
  const stataUSDC = {
    address: '0x4EA71A20e655794051D1eE8b6e4A3269B13ccaCc',
    abi: stataUSDCAbi
  } as const;
  const approve_and_balance = useReadContracts({
    contracts: [
      {
        ...USDCContract,
        functionName: 'balanceOf',
        args: [account.address ?? zeroAddress]
      },
      {
        ...USDCContract,
        functionName: 'allowance',
        args: [account.address ?? zeroAddress, stataUSDC.address]
      },
      {
        ...aUSDCContract,
        functionName: 'balanceOf',
        args: [account.address ?? zeroAddress]
      },
      {
        ...aUSDCContract,
        functionName: 'allowance',
        args: [account.address ?? zeroAddress, stataUSDC.address]
      },
      {
        ...stataUSDC,
        functionName: 'balanceOf',
        args: [account.address ?? zeroAddress]
      }
    ]
  })

  const correctChain = account.chainId === base.id
  async function approve(e: React.FormEvent<HTMLFormElement>, address: Address) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const amount = formData.get('approve') as string
    writeContract({
      address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        stataUSDC.address, parseUnits(amount, 6)
      ]
    })
  }

  async function approveUnlimited(e: React.MouseEvent, address: Address) {
    e.preventDefault()
    writeContract({
      address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        stataUSDC.address, maxUint256
      ]
    })
  }

  async function revoke(e: React.MouseEvent, address: Address) {
    e.preventDefault()
    writeContract({
      address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        stataUSDC.address, 0n
      ]
    })
  }
  async function deposit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    console.log(formData)
    const depositToAave = formData.get('asaUSDC') as string === 'true' ? false : true
    const amount = formData.get('amount') as string
    console.log(depositToAave)
    console.log(account.address!)
    writeContract({
      ...stataUSDC,
      functionName: 'deposit',
      args: [
        parseUnits(amount, 6), account.address!, 0, depositToAave
      ]
    })
  }
  async function withdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    console.log(formData)
    const depositToAave = formData.get('asaUSDC') as string === 'true' ? false : true
    const amount = formData.get('amount') as string
    console.log(depositToAave)
    console.log(account.address!)
    writeContract({
      ...stataUSDC,
      functionName: 'redeem',
      args: [
        parseUnits(amount, 6), account.address!, account.address!, depositToAave
      ]
    })
  }
  useEffect(() => {
    setInterval(() => {
      queryClient.invalidateQueries({ queryKey: approve_and_balance.queryKey })
    }, 10000)
    setTxHashArray([...txHashArray, hash])
  }, [hash])
  return (
    <>
      <div>
        <h2>stataUSDC wrap UI</h2>
        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {(account.status === 'connected' || account.status === 'reconnecting') && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      {account.isDisconnected && <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
      </div>}
      {status === 'error' && <div>{error.message}</div>}
      {approve_and_balance.isLoading && ("Loading...")}
      {approve_and_balance.isError && ("Error while fetching balance")}
      {approve_and_balance.isSuccess && <div>
        USDC Balance: {formatUnits(approve_and_balance.data[0].result ?? 0n, 6)}
        <br />
        USDC Allowance: {formatUnits(approve_and_balance.data[1].result ?? 0n, 6)}
        <br />
        aUSDC Balance: {formatUnits(approve_and_balance.data[2].result ?? 0n, 6)}
        <br />
        aUSDC Allowance: {formatUnits(approve_and_balance.data[3].result ?? 0n, 6)}
        <br />
        stataUSDC Balance: {formatUnits(approve_and_balance.data[4].result ?? 0n, 6)}
        <br />
      </div>}
      {!correctChain && (
        <h2>Connect to base to write</h2>
      )}
      <form onSubmit={(e) => {
        approve(e, USDCContract.address)
      }}>
        <fieldset disabled={!correctChain}>
        <label htmlFor="approve-usdc">Set USDC Approval</label>
        <input type='text' name='approve' id='approve-usdc'></input>
        <button type='submit'>Approve</button>
        <button onClick={(e) => {
          approveUnlimited(e, USDCContract.address)
        }}>Approve unlimited</button>
        <button onClick={(e) => {
          revoke(e, USDCContract.address)
        }}>Revoke</button>
        </fieldset>
      </form>
      <form onSubmit={(e) => {
        approve(e, aUSDCContract.address)
      }}>
        <fieldset disabled={!correctChain}>
        <label htmlFor="approve-usdc">Set aUSDC Approval</label>
        <input type='text' name='approve' id='approve-usdc'></input>
        <button type='submit'>Approve</button>
        <button onClick={(e) => {
          approveUnlimited(e, aUSDCContract.address)
        }}>Approve unlimited</button>
        <button onClick={(e) => {
          revoke(e, aUSDCContract.address)
        }}>Revoke</button>
        </fieldset>
      </form>
      <form onSubmit={deposit}>
      <fieldset disabled={!correctChain}>
        
        <label htmlFor='deposit-usdc'>Deposit (a)USDC</label>
        <input type='text' name='amount'></input>
        <label htmlFor='depositToAave'>as aUSDC: </label>
        <input type='checkbox' name='asaUSDC' value='true'></input>
        <button type='submit'>Deposit</button>
        </fieldset>
      </form>

      <form onSubmit={withdraw}>
        <fieldset disabled={!correctChain}>
        <label htmlFor='deposit-usdc'>Withdraw stataUSDC</label>
        <input type='text' name='amount'></input>
        <label htmlFor='depositToAave'>as aUSDC: </label>
        <input type='checkbox' name='asaUSDC' value='true'></input>
        <button type='submit'>Withdraw</button>
        </fieldset>
      </form>

      {txError && (
        <span>{txError.message}</span>
      )}

      {isPending && (
        <span>Waiting for tx: <a href={base.blockExplorers.default.url + '/tx/' + hash}>{hash}</a></span>
      )}

      <div>
        <h3>Tx hash:</h3>
        <div id='hashes'>
        {txHashArray.length > 0 && txHashArray.map((x) => 
          (<Fragment key={x}><span><a href={base.blockExplorers.default.url + '/tx/' + x}>{x}</a></span><br /></Fragment>)
        )}
        </div>
      </div>
      <div>
        USDC address: <a href={base.blockExplorers.default.url + '/address/' + USDCContract.address}>{USDCContract.address}</a>
        <br />
        aUSDC address: <a href={base.blockExplorers.default.url + '/address/' + aUSDCContract.address}>{aUSDCContract.address}</a>
        <br />
        stataUSDC address: <a href={base.blockExplorers.default.url + '/address/' + stataUSDC.address}>{stataUSDC.address}</a>
      </div>
    </>
  )
}

export default App
