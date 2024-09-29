import { TelegramClient, Api } from 'telegram';
import { NewMessage } from 'telegram/events';
// @ts-ignore
import input from 'input';
import { apiId, apiHash, stringSession, groupUsernames } from './config'; // Import config
import bigInt from 'big-integer';

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

(async () => {
  await client.start({
    phoneNumber: async () =>
      await input.text('Please enter your phone number: '),
    password: async () => await input.text('Please enter your password: '),
    phoneCode: async () =>
      await input.text('Please enter the code you received: '),
    onError: err => console.error('Error during client start:', err),
  });

  console.log('You should now be connected.');

  if (!stringSession) {
    console.log('Saving session:', client.session.save());
  }

  // Resolve group peer IDs
  const groupPeerIds: bigInt.BigInteger[] = [];

  await Promise.all(
    groupUsernames.map(async username => {
      try {
        const group = await client.invoke(
          new Api.contacts.ResolveUsername({ username })
        );
        const channelId =
          group.peer instanceof Api.PeerChannel
            ? bigInt(group.peer.channelId)
            : null;

        if (channelId) {
          groupPeerIds.push(channelId); // Only push if it's not null
        }
      } catch (error) {
        console.error(`Error resolving group ${username}:`, error);
      }
    })
  );

  console.log(
    `Listening to messages in groups: ${groupUsernames.join(
      ', '
    )} (peerIds: ${groupPeerIds.map(id => id.toString()).join(', ')})`
  );

  client.addEventHandler(async event => {
    const message = event.message as Api.Message;

    // Check if the message is from one of the valid groups
    if (message.peerId instanceof Api.PeerChannel) {
      const messagePeerId = bigInt(message.peerId.channelId);

      if (groupPeerIds.some(groupId => groupId.equals(messagePeerId))) {
        try {
          const senderId = message.fromId;
          if (senderId) {
            const sender = await client.getEntity(senderId);
            const senderName =
              sender instanceof Api.User
                ? sender.username ||
                  `${sender.firstName} ${sender.lastName}` ||
                  'Unknown'
                : 'Unknown';

            // Create profile link
            const senderProfileLink = `https://t.me/${
              sender instanceof Api.User ? sender.username : 'Unknown'
            }`;

            const groupEntity = await client.getEntity(message.peerId);
            const groupName =
              groupEntity instanceof Api.Chat ||
              groupEntity instanceof Api.Channel
                ? groupEntity.title || 'Unknown Group'
                : 'Unknown Group';

            const messageLink = `https://t.me/${groupUsernames[0]}/${message.id}`;

            const formattedMessage = `
  <b>Yangi xabar jo'natuvchidan:</b> <a href='${senderProfileLink}'>${senderName}</a>
  <b>Guruh:</b> ${groupName}
  <b>Xabar:</b> ${message.message}
  <b>Xabar havolasi:</b> ${messageLink}`;

            await client.sendMessage('me', {
              message: formattedMessage,
              parseMode: 'html',
            });
          } else {
            console.error('Message sender ID not found.');
          }
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      }
    }
  }, new NewMessage({}));
})();
