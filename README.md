# kappa architecture workshop

A small series of workshops to introduce kappa architecture and how to build p2p programs with modules like hypercore, multifeed, and kappa-core.

#### What is "peer-to-peer"?

Most networked programs you use are probably using *centralized* or *client-server* model. Under this model, one machine is a trusted authority (server), and every other machine is a relatively untrusted member of the network (client) that relies on the server for coordination, authentication, and authorization.

In a *decentralized* or *peer-to-peer* model, every peer is an equal authority in the network. Examples of peer-to-peer (p2p) procotols include *bittorrent*, *bitcoin*, or *tor*. Since there is no central source of truth or power, this tends to lend itself to some powerful properties:

1. generally, these services cannot be shut down by external forces, since eliminating any one peer will not take down the rest
2. generally, these services work well offline, since the full dataset tends to be stored on every peer
3. generally, these services lend themselves well to collective ownership, since it's difficult for any one peer to force authority on other peers
4. generally, these services tend to scale very well and very cheaply: the more popular data is, the more efficiently it can be found & shared

Peer-to-peer networks have some challenges as well:

- writing p2p networks tends to be more challenging to design and code
- you can't force peers to upgrade/change, so protocol or data format changes may take a long time to be used by all peers (if ever)
- getting two laptops to find & connect to each other over a network tends to be less reliable than a laptop connecting to a public server with lots of uptime
- if rare data exists only on a scarce few peers, and those peers go offline, data will become unavailable

Some folks have been throwing around the confusing term "serverless", which is misleading, since it's still centered on using another company's servers to control the networked system. Peer-to-peer programs continue to work in the absence of servers.

#### Is this production-ready?

Yes! From [researchers in universities](http://datproject.org) all the way to the [remote reaches of the amazon rainforst](http://mapeo.world), people are already using the tools you're learning in this workshop. Check out [http://dat.land](http://dat.land) for an up-to-date list of those who use these applications.

#### OK, I'm ready

[Get started](https://noffle.github.io/kappa-arch-workshop/build/01.html)

# License

[CC-BY-SA](https://creativecommons.org/licenses/by-sa/2.0/)

