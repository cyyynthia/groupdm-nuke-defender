/*
 * Copyright (c) 2021 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const { React, getModule, getModuleByDisplayName, modal } = require('powercord/webpack')
const { AsyncComponent } = require('powercord/components')
const { sleep } = require('powercord/util')

module.exports = AsyncComponent.from((async () => {
  await sleep(1e3)

  const opener = await getModule((m) => m.show?.toString().includes('openModalLazy'))
  let promise;
  const ogOpenLazy = modal.openModalLazy;
  modal.openModalLazy = (a) => promise = a();
  await opener.show()
  modal.openModalLazy = ogOpenLazy;
  await promise;

  const BlockedDomainModal = await getModuleByDisplayName('BlockedDomainModal')
  return React.memo(
    ({ user }) => {
      console.log('ok')
      const vdom = BlockedDomainModal({ domain: '', transitionState: 1 })
      vdom.props.children[1].props.children.props.children[0].props.children = 'Threat Mitigated'
      vdom.props.children[1].props.children.props.children[1].props.children = [ 'Userbot ', user, ' attempted to mass-add you to group DMs to clutter your Discord with hundreds of pings and spam groups in your DM list. The user has been blocked to stop the attack, and groups have been left. Stay safe, fren!' ]
      return vdom
    }
  )
})())
