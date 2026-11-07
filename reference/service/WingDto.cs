namespace Aviv_Service.Models

{

    public record WingRequestDto(int[] ClientObject, int[] IdntInstitution int[] IdntWing);

 

    public class WingResponseDto

    {

        public int WingId { get; set; }

        public string WingName { get; set; } = string.Empty;

        public int WingNumb { get; set; }

        public int InstitutionId { get; set; }

        public bool IsVirtualContainer { get; set; } = false;

    }

 

}