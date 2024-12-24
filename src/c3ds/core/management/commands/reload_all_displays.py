import channels.layers
from asgiref.sync import async_to_sync
from django.core.management import BaseCommand


class Command(BaseCommand):
    help = "Reload all displays"
    def handle(self, *args, **options):
        channel_layer = channels.layers.get_channel_layer()
        async_to_sync(channel_layer.group_send)('displays', {'type': 'cmd', 'cmd': 'reload'})
